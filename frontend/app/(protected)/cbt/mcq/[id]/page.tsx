import type { Metadata } from "next";
import CBTExamClientPage from "../components/MCQClientPage";
// import {} from "../MCQClientPage";
export async function generateMetadata({
  params,
}: {
  params: { userId: string };
}): Promise<Metadata> {
  return { title: `User ${params.userId} · Gravitas Admin` };
}

export default async function CBTMCQPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  return <CBTExamClientPage id={resolvedParams.id} />;
}
