"use client";

import { useAdminGateways, useUpdateGateway } from "@/lib/hooks/useBillingAdmin";

/**
 * Admin: which payment methods customers are offered. Credentials live in the
 * server's environment, never here — this only switches configured gateways
 * on/off and picks the default.
 */
export default function GatewaysAdmin() {
  const { data, isLoading, isError } = useAdminGateways();
  const update = useUpdateGateway();

  if (isLoading) return <p role="status">Loading payment methods…</p>;
  if (isError || !data) return <p role="alert">Couldn&apos;t load payment methods.</p>;

  return (
    <section aria-labelledby="gw-h" className="space-y-3">
      <h2 id="gw-h" className="font-serif text-xl text-green-900">Payment methods</h2>
      <ul className="space-y-3">
        {data.map((g) => (
          <li key={g.code} className="rounded-2xl border border-cream-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-green-900">
                  {g.displayName}{" "}
                  {g.isDefault && g.enabled && <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">Default</span>}
                </p>
                <p className="text-xs text-green-800/70">
                  {g.capabilities.methods.join(" · ")} ·{" "}
                  {g.capabilities.recurringCharge ? "auto-renews saved cards" : "prepaid, renewal reminders"}
                </p>
                {!g.configured && (
                  <p className="mt-1 text-xs font-medium text-red-700">
                    Not configured — set this gateway&apos;s credentials in the server environment to enable it.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={`Enable ${g.displayName}`}
                    checked={g.enabled}
                    disabled={(!g.configured && !g.enabled) || update.isPending}
                    onChange={(e) => update.mutate({ code: g.code, input: { enabled: e.target.checked } })}
                  />
                  {g.enabled ? "On" : "Off"}
                </label>
                <button
                  type="button"
                  disabled={!g.enabled || g.isDefault || update.isPending}
                  onClick={() => update.mutate({ code: g.code, input: { isDefault: true } })}
                  className="rounded-full border border-green-800 px-3 py-1 text-xs font-semibold text-green-800 disabled:opacity-40"
                >
                  Make default
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
