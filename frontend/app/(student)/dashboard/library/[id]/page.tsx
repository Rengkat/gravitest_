import type { Metadata } from "next";
import { ContentDetailView } from "./components/ContentDetailView";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return { title: "Content · Gravitas Library" };
}

export default async function LibraryContentPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  return <ContentDetailView contentId={resolvedParams.id} />;
}
