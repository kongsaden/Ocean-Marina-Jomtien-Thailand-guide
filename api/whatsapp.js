const crypto = require("node:crypto");

const FAQ = `
Ocean Marina Jomtien Visitor Assistance — verified starter facts:
- Local guide: https://kongsaden.github.io/Ocean-Marina-Jomtien-Thailand-guide/
- Taxi contact: Preecha Taxi Limousien / Phoodech Transport, phone and WhatsApp +66 90 950 9329. This is an independent transport provider, not an Ocean Marina-operated transfer service.
- Hospitals listed in the guide: Jomtien Hospital, Bangkok Hospital Pattaya, Pattaya Memorial Hospital.
- Thailand emergency medical number: 1669. For immediate danger, contact local emergency services.
- The service provides local information only. It does not book taxis, arrange transfers, make restaurant reservations, or guarantee opening hours/prices.
- If asked about current prices, availability, opening hours, bookings, or anything not listed here, say you cannot confirm and offer to connect them with Ocean Marina staff.
`;

const SYSTEM = `You are Ocean Marina Jomtien Visitor Assistance. Reply in the same language as the visitor: English, Thai, Simplified Chinese, or Spanish. Be concise, welcoming and practical. Use only the supplied facts. Never invent prices, schedules, phone numbers, opening hours, availability, directions, or policies. Do not claim to book or arrange transport. If a question is outside the facts, uncertain, urgent, or requires a staff decision, politely say a staff member will assist. For medical emergencies, tell the visitor to call 1669 immediately. Provide the Local Guide link when useful. Do not ask for passwords, payment details, or sensitive personal data.`;

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function isValidMetaSignature(rawBody, signature) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signature || !signature.startsWith("sha256=")) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function sendWhatsApp(to, body) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) throw new Error("WhatsApp credentials are not configured");
  const url = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v23.0"}/${phoneNumberId}/messages`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: true, body: String(body).slice(0, 3500) }
    })
  });
  if (!r.ok) throw new Error(`WhatsApp send failed: ${r.status} ${await r.text()}`);
}

async function answer(visitorText) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: SYSTEM,
      input: `Reference information:\n${FAQ}\n\nVisitor message:\n${visitorText}`,
      max_output_tokens: 350
    })
  });
  if (!r.ok) throw new Error(`OpenAI request failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  return data.output?.flatMap(item => item.content || [])
    .filter(item => item.type === "output_text")
    .map(item => item.text)
    .join("\n").trim()
    || "Thank you for contacting Ocean Marina Jomtien. A staff member will assist you shortly.";
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Verification failed");
  }

  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const rawBody = await readRawBody(req);
    if (!isValidMetaSignature(rawBody, req.headers["x-hub-signature-256"])) {
      return json(res, 401, { error: "Invalid webhook signature" });
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        for (const msg of change.value?.messages || []) {
          if (msg.type !== "text" || !msg.from || !msg.text?.body) continue;
          const reply = await answer(msg.text.body);
          await sendWhatsApp(msg.from, reply);
        }
      }
    }
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error("WhatsApp webhook processing failed:", error);
    return json(res, 500, { error: "Webhook processing failed" });
  }
};

module.exports.config = {
  api: { bodyParser: false }
};
