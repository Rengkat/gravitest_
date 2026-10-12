export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4">
      <div className="w-6 h-0.5 rounded-sm bg-green-500" />
      <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-green-600">
        {children}
      </span>
    </div>
  );
}
