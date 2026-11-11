# Ocean Marina Jomtien — WhatsApp AI Assistant

This is a Vercel Node.js serverless webhook scaffold. It does not activate WhatsApp until Meta credentials and an OpenAI API key are configured.

## Deploy to Vercel

1. Import the GitHub repository `kongsaden/Ocean-Marina-Jomtien-Thailand-guide` into Vercel.
2. Set **Root Directory** to the repository root (leave it blank/default). Do not set it to `api`: the function is already located at `api/whatsapp.js`, and its route will be `/api/whatsapp`.
3. Keep the project framework setting compatible with a Node.js serverless function. No frontend build command is required for this API-only function; if Vercel detects the existing static site, preserve its current configuration.
4. In **Project Settings → Environment Variables**, add every variable listed in `.env.example`. Use the real values from Meta and OpenAI; never commit real tokens to GitHub.
5. Deploy the project. Your webhook callback URL will be `https://YOUR-VERCEL-DOMAIN/api/whatsapp`.
6. In Meta for Developers → WhatsApp → Configuration, set the Callback URL to that URL and the Verify Token to the exact value of `WHATSAPP_VERIFY_TOKEN`.
7. Subscribe to the `messages` webhook field. Make sure `WHATSAPP_APP_SECRET` is the App Secret for the same Meta app.
8. After adding or changing environment variables, redeploy so the function receives the new values.

## Required environment variables

- `WHATSAPP_VERIFY_TOKEN`: a long random string you create for webhook verification.
- `WHATSAPP_APP_SECRET`: Meta app secret, used to validate `X-Hub-Signature-256`.
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp Cloud API access token.
- `WHATSAPP_PHONE_NUMBER_ID`: the sending phone number ID from Meta.
- `WHATSAPP_API_VERSION`: supported Graph API version, for example `v23.0`; update this when required by Meta.
- `OPENAI_API_KEY`: OpenAI API key.
- `OPENAI_MODEL`: model name available to the OpenAI project, default `gpt-4.1-mini`.

## Important limitations before public launch

- Use a dedicated Ocean Marina Visitor Assistance number. Do not use the taxi provider's number.
- Do not use a number already active in the regular WhatsApp app unless its migration has been planned; Cloud API registration may affect app use.
- This starter handles inbound text messages only. It does not process images, audio, groups, bookings, or payments.
- Webhook signature verification is enabled. Persistent message deduplication, rate limiting, staff handoff workflow, monitoring, and privacy/retention controls still need to be added before production use.
- The current FAQ is intentionally small. Expand it only after Ocean Marina confirms the information.
- WhatsApp messaging charges and OpenAI API usage may apply.

## Test checklist

1. Confirm the Vercel deployment is **Ready**.
2. Open the callback URL with Meta's verification query parameters and confirm it returns the challenge.
3. Complete Meta webhook verification and subscribe to `messages`.
4. Send a test text message from an allowed WhatsApp tester account.
5. Confirm the reply is accurate in all four supported languages and that unknown questions are escalated rather than guessed.
6. Check Vercel runtime logs for errors before enabling the service for visitors.
