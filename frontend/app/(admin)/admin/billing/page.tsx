import type { Metadata } from "next";
import BillingAdminClient from "./BillingAdminClient";

export const metadata: Metadata = {
  title: "Plans & Access",
  robots: { index: false, follow: false },
};

const Page = () => <BillingAdminClient />;

export default Page;
