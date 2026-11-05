export type VideoSource =
  | { kind: "iframe"; src: string }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string };

/**
 * Decide how to play an admin-supplied link. Only YouTube and Vimeo are ever
 * put in an <iframe> (with fixed, https embed URLs built here — never the raw
 * input), direct video files use <video>, and anything else opens in a new tab.
 */
export function resolveVideoSource(raw: string): VideoSource {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "link", src: raw };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { kind: "link", src: raw };

  const host = url.hostname.replace(/^www\./, "");
  const idOk = (v: string | null | undefined): v is string => !!v && /^[\w-]{6,20}$/.test(v);

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    if (idOk(id)) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = url.searchParams.get("v") ?? (["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : undefined);
    if (idOk(id)) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).find((p) => /^\d{5,12}$/.test(p));
    if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  if (/\.(mp4|webm|ogg|mov)$/i.test(url.pathname)) return { kind: "file", src: url.toString() };
  return { kind: "link", src: url.toString() };
}
