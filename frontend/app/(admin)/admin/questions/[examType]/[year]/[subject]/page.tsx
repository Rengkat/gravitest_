import { redirect } from "next/navigation";

// See [examType]/[year]/page.tsx — same consolidation.
export default async function SubjectRedirectPage({
  params,
}: {
  params: Promise<{ examType: string; year: string; subject: string }>;
}) {
  const { examType, year, subject } = await params;
  redirect(`/admin/questions/${examType}?year=${year}&subject=${subject}`);
}
