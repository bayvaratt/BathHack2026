import { supabase } from "@/lib/supabase";

export const FLIGHT_CLASS_TO_DB = {
  Economy: "economy",
  "Premium Economy": "premium_economy",
  Business: "business",
  First: "first",
} as const;

function normalizeRegion(region: string) {
  if (region === "everywhere") {
    return "all";
  }

  return region;
}

export async function saveNotificationPreference({
  email,
  phoneNumber,
  origin,
  region,
  cabinClass,
  departWithinDays,
}: {
  email?: string;
  phoneNumber?: string;
  origin: string;
  region: string;
  cabinClass: keyof typeof FLIGHT_CLASS_TO_DB;
  departWithinDays: number;
}) {
  if (!email && !phoneNumber) {
    throw new Error("Please provide an email or a phone number.");
  }

  const normalizedEmail = email?.trim() || null;
  const normalizedPhoneNumber = phoneNumber?.trim() || null;

  let subscriberId: string | null = null;

  if (normalizedEmail) {
    const { data: existingByEmail, error: existingByEmailError } = await supabase
      .from("subscribers")
      .select("id, phone_number")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingByEmailError) {
      throw new Error(existingByEmailError.message);
    }

    if (existingByEmail) {
      subscriberId = existingByEmail.id;

      if (
        normalizedPhoneNumber &&
        existingByEmail.phone_number !== normalizedPhoneNumber
      ) {
        const { error: updateSubscriberError } = await supabase
          .from("subscribers")
          .update({ phone_number: normalizedPhoneNumber })
          .eq("id", subscriberId);

        if (updateSubscriberError) {
          throw new Error(updateSubscriberError.message);
        }
      }
    }
  }

  if (!subscriberId && normalizedPhoneNumber) {
    const { data: existingByPhone, error: existingByPhoneError } = await supabase
      .from("subscribers")
      .select("id, email")
      .eq("phone_number", normalizedPhoneNumber)
      .maybeSingle();

    if (existingByPhoneError) {
      throw new Error(existingByPhoneError.message);
    }

    if (existingByPhone) {
      subscriberId = existingByPhone.id;

      if (normalizedEmail && existingByPhone.email !== normalizedEmail) {
        const { error: updateSubscriberError } = await supabase
          .from("subscribers")
          .update({ email: normalizedEmail })
          .eq("id", subscriberId);

        if (updateSubscriberError) {
          throw new Error(updateSubscriberError.message);
        }
      }
    }
  }

  if (!subscriberId) {
    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .insert({
        email: normalizedEmail,
        phone_number: normalizedPhoneNumber,
      })
      .select("id")
      .single();

    if (subscriberError || !subscriber) {
      throw new Error(subscriberError?.message ?? "Failed to save subscriber.");
    }

    subscriberId = subscriber.id;
  }

  const { error: preferenceError } = await supabase
    .from("user_preferences")
    .upsert(
      {
        subscriber_id: subscriberId,
        origin,
        region: normalizeRegion(region),
        cabin_class: FLIGHT_CLASS_TO_DB[cabinClass],
        depart_within_days: departWithinDays,
      },
      {
        onConflict: "subscriber_id,origin,region,cabin_class",
      },
    );

  if (preferenceError) {
    throw new Error(preferenceError.message);
  }

  return subscriberId;
}
