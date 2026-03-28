type SendRecommendationEmailParams = {
  to: string;
  subject: string;
  html: string;
};

type ResendEmailResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

export async function sendRecommendationEmail({
  to,
  subject,
  html,
}: SendRecommendationEmailParams) {
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

  const data = (await response.json()) as ResendEmailResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Failed to send email with Resend");
  }

  return data;
}
