import CompareTable from "./CompareTable";
import PricingFAQ from "./FAQ";
import PricingCTA from "./PricingCTA";
import PricingHero from "./PricingHero";
import TrustBar from "./TrustBar";

// The old "Add-ons" strip advertised packs (essay bundles, mock bundles, offline
// pack…) that are not products in the system — nothing could be bought. Removed
// so the page only shows what can actually be purchased. Individually sold
// library resources are mentioned under the comparison table.
const PricingPageClient = () => {
  return (
    <>
      <PricingHero />
      <TrustBar />
      <CompareTable />
      <PricingFAQ />
      <PricingCTA />
    </>
  );
};
export default PricingPageClient;
