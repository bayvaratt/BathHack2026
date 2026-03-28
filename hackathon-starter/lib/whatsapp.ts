type SendWhatsAppMessageParams = {
  to: string;
  body: string;
};

type TwilioMessageResponse = {
  sid?: string;
  message?: string;
};

function normalizeWhatsAppNumber(value: string) {
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

export async function sendWhatsAppMessage({
  to,
  body,
}: SendWhatsAppMessageParams) {
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

  const data = (await response.json()) as TwilioMessageResponse;

  if (!response.ok) {
    throw new Error(data.message ?? "Failed to send WhatsApp message.");
  }

  return data;
}
