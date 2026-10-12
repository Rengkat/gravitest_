import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import BillingPage from "./components/BillingClientPage";

// BillingPage reads ?upgrade=1 via useSearchParams, which needs a Suspense boundary.
const page = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-green-600" />
        </div>
      }>
      <BillingPage />
    </Suspense>
  );
};

export default page;
