import { redirect } from "next/navigation";

// This route used to render its own duplicate copy of the Overview tab
// (components/OverviewTab.tsx, byte-for-byte the same mock UI as the root
// page) — but the tab nav in layout.tsx has always linked "Overview" to
// the root URL (/dashboard/performance), so this route was unreachable
// from the UI and had silently drifted out of sync. Consolidated to the
// root page; this just redirects in case anything had it bookmarked.
export default function OverviewPage() {
  redirect("/dashboard/performance");
}
