import { redirect } from "next/navigation";

// The year/subject drill-down levels were consolidated into the parent
// exam-type page as real filters (year/subject/difficulty/type/status)
// against the actual GET /questions API, instead of 3 separate pages of
// hardcoded mock data. This redirects old bookmarked URLs there.
export default async function YearRedirectPage({
  params,
}: {
  params: Promise<{ examType: string; year: string }>;
}) {
  const { examType, year } = await params;
  redirect(`/admin/questions/${examType}?year=${year}`);
}
