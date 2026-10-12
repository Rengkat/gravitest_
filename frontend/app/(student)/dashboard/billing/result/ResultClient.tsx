"use client";

import { useSearchParams } from "next/navigation";
import type { BackendTransaction } from "@/lib/api/billing";
import CheckoutResult from "@/Components/billing/CheckoutResult";

/**
 * Where "Continue" goes after a confirmed payment. The payment gateways have a
 * single return URL, so one page serves plan purchases and library purchases.
 */
export function nextStepAfterPayment(tx: BackendTransaction): { href: string; label: string } {
  if (tx.type === "content_purchase" && tx.relatedEntityId) {
    return { href: `/dashboard/library/${tx.relatedEntityId}`, label: "Open your purchase" };
  }
  return { href: "/dashboard/billing", label: "View my plan" };
}

export default function ResultClient() {
  const params = useSearchParams();
  return (
    <CheckoutResult
      search={params}
      successAction={nextStepAfterPayment}
      retryHref="/dashboard/billing"
    />
  );
}
