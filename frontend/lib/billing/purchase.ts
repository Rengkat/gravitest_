import { purchaseContent } from "@/lib/api/library";
import type { PaymentGatewayCode } from "@/lib/api/billing";
import { redirectToCheckout } from "./checkout";

/**
 * Starts a one-time library purchase: asks the server for a checkout on the
 * chosen gateway (undefined = the admin's default) and sends the browser there.
 * Throws on failure (callers show the message); on success the page navigates
 * away, so callers should not expect to keep running.
 *
 * The single code path for every "buy this resource" button.
 */
export async function startContentPurchase(
  contentId: string,
  gateway?: PaymentGatewayCode,
  deps: {
    purchase?: typeof purchaseContent;
    redirect?: (url: string) => void;
  } = {},
): Promise<void> {
  const purchase = deps.purchase ?? purchaseContent;
  const redirect = deps.redirect ?? ((u: string) => redirectToCheckout(u));
  const { authorizationUrl } = await purchase(contentId, gateway);
  redirect(authorizationUrl);
}
