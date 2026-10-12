"use client";

import Link from "next/link";
import type { BackendTransaction } from "@/lib/api/billing";
import { parseCheckoutReturn } from "@/lib/billing/checkout";
import { formatKobo } from "@/lib/billing/pricing";
import { useCheckoutStatus } from "@/lib/hooks/useBilling";

interface Props {
  /** The page's search params: a string, URLSearchParams, or Next's record. */
  search: string | URLSearchParams | Record<string, string | string[] | undefined>;
  successHref?: string;
  /**
   * Where "Continue" goes, decided from the confirmed transaction — a gateway
   * has ONE return URL for every kind of payment, so a plan purchase and a
   * book purchase both land here. Takes precedence over `successHref`.
   */
  successAction?: (tx: BackendTransaction) => { href: string; label: string };
  retryHref?: string;
  pollMs?: number;
}

/**
 * The page a customer lands on after paying (or not) on ANY gateway's hosted
 * checkout. Reads the reference from the URL, then asks OUR server what
 * happened — nothing in the URL is trusted as an outcome.
 */
export default function CheckoutResult({ search, successHref = "/dashboard", successAction, retryHref = "/pricing", pollMs }: Props) {
  const { reference, cancelled } = parseCheckoutReturn(search);
  const { data, outcome, timedOut, isError, refetch } = useCheckoutStatus(cancelled ? null : reference, pollMs);

  if (cancelled) {
    return (
      <Panel title="Payment cancelled" tone="neutral">
        <p>You cancelled the payment, so nothing was charged.</p>
        <Action href={retryHref}>Choose a plan</Action>
      </Panel>
    );
  }

  if (!reference) {
    return (
      <Panel title="We couldn't find your payment" tone="neutral">
        <p>This page needs a payment reference. If you were charged, your plan will still activate automatically.</p>
        <Action href={retryHref}>Back to plans</Action>
      </Panel>
    );
  }

  if (outcome === "success") {
    const next = data && successAction ? successAction(data) : { href: successHref, label: "Continue" };
    return (
      <Panel title="Payment successful" tone="good">
        <p>Thank you! Your payment{data ? ` of ${formatKobo(Number(data.amountKobo))}` : ""} was received.</p>
        <Action href={next.href}>{next.label}</Action>
      </Panel>
    );
  }

  if (outcome === "failed") {
    return (
      <Panel title="Payment not completed" tone="bad">
        <p>{data?.gatewayMessage || "The payment didn't go through."} You have not been charged for a plan.</p>
        <Action href={retryHref}>Try again</Action>
      </Panel>
    );
  }

  if (timedOut || isError) {
    return (
      <Panel title="Still confirming your payment" tone="neutral">
        <p>
          This is taking longer than usual. If money left your account, don&apos;t pay again — your plan will
          activate automatically as soon as the payment is confirmed.
        </p>
        <button type="button" onClick={() => void refetch()} className="mt-3 rounded-full border border-green-800 px-4 py-2 text-sm font-semibold text-green-800">
          Check again
        </button>
      </Panel>
    );
  }

  return (
    <Panel title="Confirming your payment…" tone="neutral">
      <p role="status">Please wait — this usually takes a few seconds. Don&apos;t close this page.</p>
    </Panel>
  );
}

function Panel({ title, tone, children }: { title: string; tone: "good" | "bad" | "neutral"; children: React.ReactNode }) {
  const border = tone === "good" ? "border-green-600" : tone === "bad" ? "border-red-400" : "border-cream-border";
  return (
    <section className={`mx-auto max-w-md rounded-[20px] border bg-white p-8 text-center ${border}`}>
      <h1 className="mb-3 font-serif text-2xl text-green-900">{title}</h1>
      <div className="space-y-3 text-sm text-green-800/80">{children}</div>
    </section>
  );
}

function Action({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mt-2 inline-block rounded-full bg-green-800 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700">
      {children}
    </Link>
  );
}
