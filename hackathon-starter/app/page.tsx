"use client";

import { FormEvent, useState } from "react";

type SendResult =
  | {
      type: "success";
      message: string;
    }
  | {
      type: "error";
      message: string;
    }
  | null;

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<SendResult>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientEmail: email }),
      });

      const data = (await response.json()) as {
        error?: string;
        destination?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to send test email.");
      }

      setResult({
        type: "success",
        message: `Test email sent successfully. Check your inbox for the ${data.destination ?? "featured"} deal.`,
      });
      setEmail("");
    } catch (error) {
      setResult({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to send test email.",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fdf8ef_0%,#f4efe4_100%)] px-6 py-12 text-stone-900">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl flex-col justify-center gap-10 lg:flex-row lg:items-stretch">
        <section className="flex-1 rounded-[2rem] border border-stone-300/70 bg-white/80 p-8 shadow-[0_20px_80px_rgba(120,83,34,0.12)] backdrop-blur">
          <div className="mb-10 inline-flex rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-sm font-medium text-amber-900">
            WanderDrop Test Console
          </div>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            Send yourself a mock flight deal and watch the pipeline work.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">
            This page triggers the server route, builds the recommendation email
            from mock data, and sends it through Resend so you can test the
            full flow in one click.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-stone-100 p-4">
              <div className="text-sm font-medium text-stone-500">
                Destination
              </div>
              <div className="mt-2 text-2xl font-semibold">Madrid</div>
            </div>
            <div className="rounded-2xl bg-stone-100 p-4">
              <div className="text-sm font-medium text-stone-500">Price</div>
              <div className="mt-2 text-2xl font-semibold">£38 one way</div>
            </div>
            <div className="rounded-2xl bg-stone-100 p-4">
              <div className="text-sm font-medium text-stone-500">Discount</div>
              <div className="mt-2 text-2xl font-semibold">46% below average</div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-xl rounded-[2rem] bg-stone-950 p-8 text-stone-50 shadow-[0_20px_80px_rgba(41,29,12,0.28)]">
          <div className="text-sm font-medium uppercase tracking-[0.24em] text-amber-300">
            Live email test
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Send the mock recommendation
          </h2>
          <p className="mt-4 text-base leading-7 text-stone-300">
            Enter your email address below and the app will call the server API
            route you asked for. If Resend is configured correctly, the message
            should land in your inbox right away.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-200">
                Recipient email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl border border-stone-700 bg-stone-900 px-4 py-3 text-base text-white outline-none transition focus:border-amber-400"
              />
            </label>

            <button
              type="submit"
              disabled={isSending}
              className="w-full rounded-2xl bg-amber-300 px-5 py-3 text-base font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-100"
            >
              {isSending ? "Sending test email..." : "Send test email"}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-stone-800 bg-stone-900/70 p-5">
            <div className="text-sm font-medium text-stone-400">What happens</div>
            <div className="mt-3 text-sm leading-7 text-stone-300">
              Mock deal data becomes an email card, the API route posts it to
              Resend, and this panel reports the result.
            </div>
          </div>

          {result ? (
            <div
              className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${
                result.type === "success"
                  ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30"
                  : "bg-red-500/15 text-red-200 ring-1 ring-red-400/30"
              }`}
            >
              {result.message}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
