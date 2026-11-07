/** Circular profile image, or a neutral default silhouette. Decorative: the author's name is always next to it. */
export default function Avatar({ url, size = 40 }: { url: string | null | undefined; size?: number }) {
  const style = { width: size, height: size };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" loading="lazy" style={style} className="shrink-0 rounded-full object-cover bg-gray-200" />;
  }
  return (
    <span style={style} aria-hidden="true" className="flex shrink-0 items-end justify-center overflow-hidden rounded-full bg-gray-200">
      <svg viewBox="0 0 40 40" width={size} height={size} fill="#9ca3af">
        <circle cx="20" cy="15" r="7" />
        <ellipse cx="20" cy="37" rx="14" ry="11" />
      </svg>
    </span>
  );
}
