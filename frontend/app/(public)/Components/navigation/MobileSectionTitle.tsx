export default function MobileSectionTitle({
  children,
  first = false,
}: {
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <p
      className={[
        "text-[10px] font-extrabold tracking-[0.12em] uppercase text-text-light pb-2 m-0",
        first ? "pt-1" : "pt-4 mt-2 border-t border-cream-border",
      ].join(" ")}>
      {children}
    </p>
  );
}
