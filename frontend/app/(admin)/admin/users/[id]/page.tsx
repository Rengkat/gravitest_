import type { Metadata } from "next";
import { UserDetailView } from "./components/UserDetailView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `User ${id} · Gravitest Admin` };
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <UserDetailView userId={resolvedParams.id} />;
}
