import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
import { buildEmailHTML } from "./email-template.mjs";
import { buildWhatsAppMessage } from "./whatsapp-template.mjs";
import {
  sendRecommendationEmail,
  sendWhatsAppMessage,
} from "./providers.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

loadLocalEnv(projectRoot);

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function getCurrencySymbol(currency) {
  if (currency === "GBP") {
    return "GBP ";
  }

  return `${currency} `;
}

function getBadge(discountPercent) {
  if (discountPercent >= 40) {
    return "Massively Discounted";
  }

  if (discountPercent >= 30) {
    return "Strong Deal";
  }

  return "Below Average";
}

function isWildcardRegion(region) {
  return region === "all" || region === "everywhere";
}

async function fetchLookupMap(table) {
  const columns =
    table === "destinations"
      ? "iata_code, city, country, region"
      : "iata_code, city, country";

  const { data, error } = await supabase
    .from(table)
    .select(columns);

  if (error) {
    throw new Error(`Failed to load ${table}: ${error.message}`);
  }

  return new Map((data ?? []).map((row) => [row.iata_code, row]));
}

async function fetchPendingMatches() {
  const [
    { data: deals, error: dealsError },
    { data: preferences, error: preferencesError },
    { data: notifications, error: notificationsError },
    { data: averages, error: averagesError },
  ] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, origin, destination, cabin_class, airline, departure_date, new_price, currency, discount_percent, detected_at",
      )
      .order("detected_at", { ascending: false }),
    supabase
      .from("user_preferences")
      .select(
        "subscriber_id, origin, region, cabin_class, subscribers(id, email, phone_number)",
      ),
    supabase.from("notifications").select("subscriber_id, deal_id"),
    supabase
      .from("price_averages")
      .select("origin, destination, cabin_class, average_price, currency"),
  ]);

  if (dealsError) {
    throw new Error(`Failed to load deals: ${dealsError.message}`);
  }

  if (preferencesError) {
    throw new Error(`Failed to load user preferences: ${preferencesError.message}`);
  }

  if (notificationsError) {
    throw new Error(`Failed to load notifications: ${notificationsError.message}`);
  }

  if (averagesError) {
    throw new Error(`Failed to load price averages: ${averagesError.message}`);
  }

  const sentPairs = new Set(
    (notifications ?? []).map((row) => `${row.subscriber_id}:${row.deal_id}`),
  );

  const averagesMap = new Map(
    (averages ?? []).map((row) => [
      `${row.origin}:${row.destination}:${row.cabin_class}`,
      row,
    ]),
  );

  return {
    deals: deals ?? [],
    preferences: preferences ?? [],
    sentPairs,
    averagesMap,
  };
}

async function insertNotifications(subscriberId, deals) {
  const rows = deals.map((deal) => ({
    subscriber_id: subscriberId,
    deal_id: deal.id,
  }));

  const { error } = await supabase.from("notifications").insert(rows);

  if (error) {
    throw new Error(`Failed to insert notifications: ${error.message}`);
  }
}

async function main() {
  const { deals, preferences, sentPairs, averagesMap } =
    await fetchPendingMatches();
  const [originsMap, destinationsMap] = await Promise.all([
    fetchLookupMap("origins"),
    fetchLookupMap("destinations"),
  ]);

  const subscriberDeals = new Map();

  for (const preference of preferences) {
    const subscriber = Array.isArray(preference.subscribers)
      ? preference.subscribers[0]
      : preference.subscribers;

    if (!subscriber) {
      continue;
    }

    const matchingDeals = deals
      .filter((deal) => {
        const alreadySent = sentPairs.has(
          `${preference.subscriber_id}:${deal.id}`,
        );

        return (
          !alreadySent &&
          deal.origin === preference.origin &&
          (
            isWildcardRegion(preference.region) ||
            preference.region === deal.destination ||
            destinationsMap.get(deal.destination)?.region === preference.region
          ) &&
          deal.cabin_class === preference.cabin_class
        );
      })
      .map((deal) => {
        const average = averagesMap.get(
          `${deal.origin}:${deal.destination}:${deal.cabin_class}`,
        );

        return {
          ...deal,
          average_price: average?.average_price ?? null,
          sample_count: null,
        };
      });

    if (matchingDeals.length === 0) {
      continue;
    }

    subscriberDeals.set(preference.subscriber_id, {
      subscriber,
      deals: matchingDeals.map((deal) => {
        const origin = originsMap.get(deal.origin);
        const destination = destinationsMap.get(deal.destination);

        return {
          ...deal,
          origin_iata: deal.origin,
          destination_iata: deal.destination,
          destination_city: destination?.city ?? deal.destination,
          destination_country: destination?.country ?? "",
          origin_city: origin?.city ?? deal.origin,
          currency_symbol: getCurrencySymbol(deal.currency),
          average_price:
            deal.average_price ?? deal.new_price,
          badge: getBadge(Number(deal.discount_percent)),
        };
      }),
    });
  }

  let emailCount = 0;
  let whatsappCount = 0;
  let notificationRows = 0;
  const deliveryErrors = [];

  for (const [subscriberId, payload] of subscriberDeals.entries()) {
    const { subscriber, deals: matchedDeals } = payload;
    let delivered = false;

    if (subscriber.email) {
      try {
        await sendRecommendationEmail({
          to: subscriber.email,
          subject: `Flight deal: ${matchedDeals[0].destination_city} is ${matchedDeals[0].discount_percent}% cheaper than usual`,
          html: buildEmailHTML(matchedDeals),
        });
        emailCount += 1;
        delivered = true;
      } catch (error) {
        deliveryErrors.push({
          channel: "email",
          subscriberId,
          message: error instanceof Error ? error.message : "Unknown email error",
        });
      }
    }

    if (subscriber.phone_number) {
      try {
        await sendWhatsAppMessage({
          to: subscriber.phone_number,
          body: buildWhatsAppMessage(matchedDeals),
        });
        whatsappCount += 1;
        delivered = true;
      } catch (error) {
        deliveryErrors.push({
          channel: "whatsapp",
          subscriberId,
          message: error instanceof Error ? error.message : "Unknown WhatsApp error",
        });
      }
    }

    if (delivered) {
      await insertNotifications(subscriberId, matchedDeals);
      notificationRows += matchedDeals.length;
    }
  }

  console.log(
    JSON.stringify(
      {
        subscribersMatched: subscriberDeals.size,
        emailsSent: emailCount,
        whatsappSent: whatsappCount,
        notificationsInserted: notificationRows,
        deliveryErrors,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
