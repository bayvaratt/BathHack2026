import { buildEmailHTML, getDealSummary } from "@/lib/email-template";
import { sendRecommendationEmail } from "@/lib/email";
import { MOCK_DEALS } from "@/lib/mock-deals";

type TestEmailRequestBody = {
  recipientEmail?: string;
};

export async function POST(request: Request) {
  let body: TestEmailRequestBody;

  try {
    body = (await request.json()) as TestEmailRequestBody;
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const recipientEmail = body.recipientEmail?.trim();

  if (!recipientEmail) {
    return Response.json(
      { error: "recipientEmail is required." },
      { status: 400 },
    );
  }

  const dealsWithSummaries = MOCK_DEALS.map((deal) => ({
    ...deal,
    summary: getDealSummary(deal),
  }));

  const html = buildEmailHTML(dealsWithSummaries);
  const topDeal = dealsWithSummaries[0];

  try {
    const resendResponse = await sendRecommendationEmail({
      to: recipientEmail,
      subject: `Flight deal: ${topDeal.destination_city} is ${topDeal.discountPercent}% cheaper than usual`,
      html,
    });

    return Response.json({
      ok: true,
      recipientEmail,
      emailId: resendResponse.id ?? null,
      destination: topDeal.destination_city,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send test email.";

    return Response.json({ error: message }, { status: 500 });
  }
}
