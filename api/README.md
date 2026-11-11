# Ocean Marina Jomtien — WhatsApp AI Assistant

This is a Vercel serverless webhook scaffold. It does not activate WhatsApp until Meta credentials and an OpenAI API key are configured.

## Deploy
1. Import this GitHub repository into Vercel.
2. Set the Vercel project Root Directory to `api` only if deploying the API as its own project; alternatively move this handler to the project root's `api/` directory and deploy the repository root.
3. Add the environment variables from `.env.example` in Vercel Project Settings → Environment Variables. Never commit real tokens.
4. Deploy. The webhook URL will be `https://YOUR-VERCEL-DOMAIN/api/whatsapp`.
5. In Meta for Developers → WhatsApp → Configuration, set the Callback URL to that URL and the Verify Token to the exact `WHATSAPP_VERIFY_TOKEN`. Subscribe to the `messages` webhook field.
6. Add the WhatsApp Cloud API access token and Phone Number ID from Meta to Vercel environment variables, then redeploy.
7. Add the OpenAI API key to Vercel and redeploy.

## Important
- Use a dedicated Ocean Marina Visitor Assistance number. Do not use the taxi provider's number.
- Do not use a number already active in the regular WhatsApp app unless you have planned its migration; Cloud API registration may affect app use.
- This starter handles inbound text messages only. It does not process images, audio, groups, bookings, or payments.
- Add message deduplication, signature verification, rate limiting, staff handoff, and privacy/retention controls before production use.
- WhatsApp messaging charges and OpenAI API usage may apply.
- AI answers are grounded in a small verified fact set. Expand the FAQ only after Ocean Marina confirms the information.
