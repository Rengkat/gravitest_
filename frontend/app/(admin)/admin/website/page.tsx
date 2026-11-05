import type { Metadata } from "next";
import WebsiteAdminClient from "@/Components/admin/website/WebsiteAdminClient";

export const metadata: Metadata = {
  title: "Website Content",
  robots: { index: false, follow: false },
};

const Page = () => <WebsiteAdminClient />;

export default Page;
