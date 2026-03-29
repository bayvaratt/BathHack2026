function normalizeWhatsAppNumber(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("Phone number is required.");
  }

  if (trimmedValue.startsWith("whatsapp:")) {
    return trimmedValue;
  }

  const normalizedNumber = trimmedValue.replace(/[\s()-]/g, "");

  if (!normalizedNumber.startsWith("+")) {
    throw new Error(
      "Phone number must be in international format, for example +447700900123.",
    );
  }

  return `whatsapp:${normalizedNumber}`;
}

export async function sendRecommendationEmail({ to, subject, html }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Failed to send email with Resend");
  }

  return data;
}

export async function sendWhatsAppMessage({ to, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "Missing Twilio config. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM.",
    );
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: normalizeWhatsAppNumber(from),
        To: normalizeWhatsAppNumber(to),
        Body: body,
      }).toString(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Failed to send WhatsApp message.");
  }

  return data;
}
