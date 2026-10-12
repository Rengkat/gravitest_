import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ResultClient from "./ResultClient";

// Payment gateways send the customer back here after checkout (set both
// PAYSTACK_CALLBACK_URL and OPAY_RETURN_URL to https://<app>/dashboard/billing/result).
export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
};

const Page = () => (
  <div className="max-w-5xl mx-auto py-10">
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-green-600" />
        </div>
      }>
      <ResultClient />
    </Suspense>
  </div>
);

export default Page;
