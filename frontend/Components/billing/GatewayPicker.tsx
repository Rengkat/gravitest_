"use client";

import type { PaymentGatewayCode, PaymentGatewayOption } from "@/lib/api/billing";

interface Props {
  gateways: PaymentGatewayOption[];
  value: PaymentGatewayCode | null;
  onChange: (code: PaymentGatewayCode) => void;
  disabled?: boolean;
}

/**
 * Lets the customer choose how to pay. Renders only what the admin has
 * enabled (GET /billing/gateways). With a single option it renders nothing —
 * there's no choice to make — so the page looks exactly like it did before
 * a second gateway existed.
 */
export default function GatewayPicker({ gateways, value, onChange, disabled }: Props) {
  if (gateways.length < 2) return null;

  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="mb-2 text-sm font-semibold text-green-900">Pay with</legend>
      {gateways.map((g) => {
        const selected = value === g.code;
        return (
          <label
            key={g.code}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              selected ? "border-green-700 bg-green-50" : "border-cream-border bg-white hover:border-green-500/40"
            }`}
          >
            <input
              type="radio"
              name="payment-gateway"
              value={g.code}
              checked={selected}
              onChange={() => onChange(g.code)}
              className="mt-1 accent-green-700"
            />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-green-900">{g.displayName}</span>
              <span className="block text-xs text-green-800/70">{g.capabilities.methods.join(" · ")}</span>
              {!g.capabilities.recurringCharge && (
                <span className="mt-1 block text-xs text-green-800/60">
                  One-time payment for the period — we&apos;ll remind you before it ends so you can renew.
                </span>
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

/** The gateway to pre-select: the admin's default, else the first offered. */
export function defaultGateway(gateways: PaymentGatewayOption[]): PaymentGatewayCode | null {
  return (gateways.find((g) => g.isDefault) ?? gateways[0])?.code ?? null;
}
