const STATS = [
  { num: "50", suffix: "k+", label: "Past Questions" },
  { num: "12", suffix: "k", label: "Active Students" },
  { num: "94", suffix: "%", label: "Pass Rate" },
  { num: "8", suffix: "", label: "Exam Types Covered" },
];

export default function StatsBar() {
  return (
    <div className="bg-green-800 py-9 px-[5%]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
        {STATS.map(({ num, suffix, label }, index) => (
          <div
            key={label}
            className={`reveal ${index ? `reveal-delay-${Math.min(index, 3)}` : ""} text-center md:text-left`}>
            <div className="w-5 h-[2px] bg-gold/70 mb-3 mx-auto md:mx-0" />
            <div className="font-mono text-[30px] font-semibold text-white leading-none tabular-nums mb-1.5">
              {num}
              <span className="text-gold">{suffix}</span>
            </div>
            <div className="text-[11px] font-mono font-medium text-white/45 tracking-[0.1em] uppercase">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
