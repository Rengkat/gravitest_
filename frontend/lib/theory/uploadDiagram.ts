import { uploadLibraryFile } from "@/lib/api/storage";

/**
 * The whiteboard/graph/construction canvases (ConstructionCanvas,
 * GraphCanvas, LinedCanvas) export their drawing as a base64 data URL
 * (e.g. "data:image/png;base64,..."). The AI scorer needs a real R2 URL
 * it can fetch, not a data URL living only in browser memory — this
 * converts and uploads it.
 */
export async function uploadDiagramDataUrl(dataUrl: string, label: string): Promise<string | null> {
  if (!dataUrl.startsWith("data:image")) return null;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `${label}.png`, { type: blob.type || "image/png" });
    const result = await uploadLibraryFile(file, "documents");
    return result.url;
  } catch {
    return null;
  }
}
