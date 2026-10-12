import { extractErrorMessage } from "@/lib/api/client";
import { parseAccessError } from "@/lib/billing/errors";

/**
 * What to show in the chat bubble when a tutor message fails. The server's own
 * message is used (for a paywalled tutor that's "AI Tutor is available on paid
 * plans…"); when an upgrade would help, a "See plans" link is added so the
 * student has a way forward. A feature that is switched off gets no upsell.
 */
export function tutorErrorContent(err: unknown): string {
  const message = extractErrorMessage(err);
  const denied = parseAccessError(err);
  if (denied && denied.code !== "FEATURE_DISABLED") {
    return `${message}\n\n[See plans](/dashboard/billing?upgrade=1)`;
  }
  return message;
}
