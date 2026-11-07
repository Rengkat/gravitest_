import type { Metadata } from "next";
import DiscussionModerationClient from "@/Components/admin/discussions/DiscussionModerationClient";

export const metadata: Metadata = {
  title: "Discussion Moderation",
  robots: { index: false, follow: false },
};

const Page = () => <DiscussionModerationClient />;

export default Page;
