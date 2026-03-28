import { MOCK_DEAL } from "@/lib/mock-deals";
import { buildWhatsAppMessage } from "@/lib/whatsapp-template";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

type TestWhatsAppRequestBody = {
  phoneNumber?: string;
};

export async function POST(request: Request) {
  let body: TestWhatsAppRequestBody;

  try {
    body = (await request.json()) as TestWhatsAppRequestBody;
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const phoneNumber = body.phoneNumber?.trim();

  if (!phoneNumber) {
    return Response.json(
      { error: "phoneNumber is required." },
      { status: 400 },
    );
  }

  try {
    const twilioResponse = await sendWhatsAppMessage({
      to: phoneNumber,
      body: buildWhatsAppMessage(MOCK_DEAL),
    });

    return Response.json({
      ok: true,
      phoneNumber,
      messageId: twilioResponse.sid ?? null,
      destination: MOCK_DEAL.destination_city,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to send test WhatsApp message.";

    return Response.json({ error: message }, { status: 500 });
  }
}
