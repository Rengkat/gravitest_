import type { Metadata } from "next";
import CBTEssayClientPage from "../components/TheoryClientPage";
export async function generateMetadata({
  params,
}: {
  params: { userId: string };
}): Promise<Metadata> {
  return { title: `User ${params.userId} · Gravitas Admin` };
}

export default async function CBTEssayPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  return <CBTEssayClientPage id={resolvedParams.id} />;
}
