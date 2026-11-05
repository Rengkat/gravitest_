"use client";

import CompareTable from "./CompareTable";
import PricingFAQ from "./FAQ";
import PricingCTA from "./PricingCTA";
import PricingHero from "./PricingHero";
import TrustBar from "./TrustBar";
import { useBlock } from "@/lib/hooks/useSiteContent";

// Plans, prices and the comparison table come from the admin-managed plans;
// all surrounding copy comes from the admin-managed "pricing.page" section.
// (The old "Add-ons" strip stays removed: those packs were never purchasable.)
const PricingPageClient = () => {
  const { block } = useBlock("pricing.page");
  const content = block ?? {};
  return (
    <>
      <PricingHero content={content} />
      <TrustBar content={content} />
      <CompareTable />
      <PricingFAQ />
      <PricingCTA content={content} />
    </>
  );
};
export default PricingPageClient;
