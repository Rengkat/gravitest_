import { useCallback, useEffect, useRef, useState } from "react";

type AngleMode = "DEG" | "RAD";
interface HistoryEntry {
  expr: string;
  result: string;
}

const INITIAL_RIGHT = 16;
const INITIAL_BOTTOM = 16;

export default function CalculatorModal({ onClose }: { onClose: () => void }) {
  /* ── Drag ─────────────────────────────────────────────── */
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ mx: number; my: number; ex: number; ey: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // Set initial position once the element is rendered
  useEffect(() => {
    if (containerRef.current) {
      const { offsetWidth: w, offsetHeight: h } = containerRef.current;
      setPos({
        x: window.innerWidth - w - INITIAL_RIGHT,
        y: window.innerHeight - h - INITIAL_BOTTOM,
      });
    }
  }, []);

  const clamp = useCallback((x: number, y: number) => {
    const el = containerRef.current;
    if (!el) return { x, y };
    return {
      x: Math.max(0, Math.min(x, window.innerWidth - el.offsetWidth)),
      y: Math.max(0, Math.min(y, window.innerHeight - el.offsetHeight)),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return; // don't hijack button clicks
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = containerRef.current!.getBoundingClientRect();
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ex: rect.left, ey: rect.top };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragOrigin.current) return;
      const { mx, my, ex, ey } = dragOrigin.current;
      setPos(clamp(ex + (e.clientX - mx), ey + (e.clientY - my)));
    },
    [clamp],
  );

  const onPointerUp = useCallback(() => {
    dragOrigin.current = null;
  }, []);

  /* ── Calculator state ─────────────────────────────────── */
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [memory, setMemory] = useState(0);
  const [hasMemory, setHasMemory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isShift, setIsShift] = useState(false);
  const [angleMode, setAngleMode] = useState<AngleMode>("DEG");
  const [isError, setIsError] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [justEvaled, setJustEvaled] = useState(false);

  const toRad = (d: number) => (d * Math.PI) / 180;

  const evaluate = (expr: string): number => {
    const s = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/π/g, String(Math.PI))
      .replace(/ℯ/g, String(Math.E));
    return Function(`"use strict"; return (${s})`)() as number;
  };

  const handleBtn = useCallback(
    (val: string) => {
      setIsError(false);

      if (val === "SHIFT") {
        setIsShift((s) => !s);
        return;
      }
      if (val === "DEG/RAD") {
        setAngleMode((m) => (m === "DEG" ? "RAD" : "DEG"));
        return;
      }
      if (val === "AC") {
        setDisplay("0");
        setExpression("");
        setIsShift(false);
        setJustEvaled(false);
        return;
      }
      if (val === "CE") {
        setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
        return;
      }
      if (val === "MC") {
        setMemory(0);
        setHasMemory(false);
        return;
      }
      if (val === "MR") {
        const ms = String(memory);
        setDisplay(ms);
        if (justEvaled) setExpression(ms);
        setJustEvaled(false);
        return;
      }
      if (val === "M+") {
        setMemory((m) => m + parseFloat(display));
        setHasMemory(true);
        return;
      }
      if (val === "M-") {
        setMemory((m) => m - parseFloat(display));
        setHasMemory(true);
        return;
      }

      if (val === "=") {
        try {
          const full = expression + display;
          const result = evaluate(full);
          if (!isFinite(result) || isNaN(result)) throw new Error();
          const rs = Number.isInteger(result)
            ? String(result)
            : parseFloat(result.toFixed(10)).toString();
          setHistory((h) => [{ expr: full, result: rs }, ...h.slice(0, 19)]);
          setExpression(rs);
          setDisplay(rs);
          setJustEvaled(true);
        } catch {
          setDisplay("Error");
          setExpression("");
          setIsError(true);
          setJustEvaled(false);
        }
        setIsShift(false);
        return;
      }

      const unary: Record<string, (n: number) => number> = {
        sin: (n) => Math.sin(angleMode === "DEG" ? toRad(n) : n),
        cos: (n) => Math.cos(angleMode === "DEG" ? toRad(n) : n),
        tan: (n) => Math.tan(angleMode === "DEG" ? toRad(n) : n),
        asin: (n) => (angleMode === "DEG" ? (Math.asin(n) * 180) / Math.PI : Math.asin(n)),
        acos: (n) => (angleMode === "DEG" ? (Math.acos(n) * 180) / Math.PI : Math.acos(n)),
        atan: (n) => (angleMode === "DEG" ? (Math.atan(n) * 180) / Math.PI : Math.atan(n)),
        log: (n) => Math.log10(n),
        ln: (n) => Math.log(n),
        "√x": (n) => Math.sqrt(n),
        "x²": (n) => n * n,
        "x³": (n) => n * n * n,
        "1/x": (n) => 1 / n,
        "10ˣ": (n) => Math.pow(10, n),
        eˣ: (n) => Math.exp(n),
        "n!": (n) => {
          if (n < 0 || !Number.isInteger(n)) return NaN;
          let r = 1;
          for (let i = 2; i <= n; i++) r *= i;
          return r;
        },
        "%": (n) => n / 100,
      };

      if (val in unary) {
        try {
          const n = parseFloat(display);
          const result = unary[val](n);
          if (!isFinite(result) || isNaN(result)) throw new Error();
          const rs = parseFloat(result.toFixed(10)).toString();
          setExpression(`${val}(${display})`);
          setDisplay(rs);
          setJustEvaled(true);
        } catch {
          setDisplay("Error");
          setIsError(true);
        }
        setIsShift(false);
        return;
      }

      if (val === "π") {
        setDisplay(String(Math.PI));
        if (justEvaled) setExpression(String(Math.PI));
        setJustEvaled(false);
        return;
      }
      if (val === "ℯ") {
        setDisplay(String(Math.E));
        if (justEvaled) setExpression(String(Math.E));
        setJustEvaled(false);
        return;
      }

      const operators = ["+", "-", "×", "÷", "^"];
      if (operators.includes(val)) {
        setExpression((prev) => (justEvaled ? display : prev + display) + val);
        setDisplay("0");
        setJustEvaled(false);
        return;
      }

      if (val === "(" || val === ")") {
        setExpression((prev) => prev + val);
        setJustEvaled(false);
        return;
      }
      if (val === ".") {
        if (justEvaled) {
          setDisplay("0.");
          setExpression("");
          setJustEvaled(false);
          return;
        }
        setDisplay((d) => (d.includes(".") ? d : d + "."));
        return;
      }
      if (val === "+/-") {
        setDisplay((d) => (d.startsWith("-") ? d.slice(1) : d === "0" ? d : "-" + d));
        return;
      }

      // Digit
      if (justEvaled) {
        setDisplay(val);
        setExpression("");
        setJustEvaled(false);
      } else {
        setDisplay((d) => (d === "0" ? val : d + val));
      }
    },
    [display, expression, angleMode, memory, justEvaled],
  );

  /* ── Keyboard ─────────────────────────────────────────── */
  useEffect(() => {
    const map: Record<string, string> = {
      Enter: "=",
      Backspace: "CE",
      Escape: "AC",
      s: "sin",
      c: "cos",
      t: "tan",
      l: "log",
      n: "ln",
      p: "π",
      e: "ℯ",
      r: "√x",
      "!": "n!",
    };
    const handler = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).closest("input,textarea")) return;
      const mapped = map[ev.key];
      if (mapped) {
        ev.preventDefault();
        handleBtn(mapped);
        return;
      }
      if (/^[\d.]$/.test(ev.key)) {
        ev.preventDefault();
        handleBtn(ev.key);
        return;
      }
      const opMap: Record<string, string> = { "*": "×", "/": "÷", "+": "+", "-": "-", "^": "^" };
      if (ev.key in opMap) {
        ev.preventDefault();
        handleBtn(opMap[ev.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleBtn]);

  /* ── Button layout ────────────────────────────────────── */
  type BtnDef = { label: string; val?: string; span?: number; v?: string };

  const row0: BtnDef[] = [
    { label: "SHIFT", v: isShift ? "shift-on" : "shift" },
    { label: angleMode, val: "DEG/RAD", v: "mode" },
    { label: "MC", v: "mem" },
    { label: "MR", v: "mem" },
    { label: "M+", v: "mem" },
    { label: "M-", v: "mem" },
  ];
  const row1: BtnDef[] = isShift
    ? [
        { label: "sin⁻¹", val: "asin", v: "sci" },
        { label: "cos⁻¹", val: "acos", v: "sci" },
        { label: "tan⁻¹", val: "atan", v: "sci" },
        { label: "eˣ", v: "sci" },
        { label: "10ˣ", v: "sci" },
        { label: "x³", v: "sci" },
      ]
    : [
        { label: "sin", v: "sci" },
        { label: "cos", v: "sci" },
        { label: "tan", v: "sci" },
        { label: "ln", v: "sci" },
        { label: "log", v: "sci" },
        { label: "x²", v: "sci" },
      ];
  const row2: BtnDef[] = [
    { label: "√x", v: "sci" },
    { label: "1/x", v: "sci" },
    { label: "n!", v: "sci" },
    { label: "π", v: "sci" },
    { label: "ℯ", v: "sci" },
    { label: "^", v: "sci" },
  ];
  const row3: BtnDef[] = [
    { label: "(", v: "paren" },
    { label: ")", v: "paren" },
    { label: "+/-", v: "util" },
    { label: "%", v: "sci" },
    { label: "AC", v: "clear" },
    { label: "CE", v: "del" },
  ];
  const numRows: BtnDef[][] = [
    [
      { label: "7", v: "digit" },
      { label: "8", v: "digit" },
      { label: "9", v: "digit" },
      { label: "÷", v: "op" },
    ],
    [
      { label: "4", v: "digit" },
      { label: "5", v: "digit" },
      { label: "6", v: "digit" },
      { label: "×", v: "op" },
    ],
    [
      { label: "1", v: "digit" },
      { label: "2", v: "digit" },
      { label: "3", v: "digit" },
      { label: "-", v: "op" },
    ],
    [
      { label: "0", span: 2, v: "digit" },
      { label: ".", v: "digit" },
      { label: "+", v: "op" },
    ],
    [{ label: "=", span: 4, v: "equals" }],
  ];

  const vc: Record<string, string> = {
    "shift-on": "bg-yellow-400 text-yellow-900 font-bold",
    shift: "bg-green-700 text-white hover:bg-green-600",
    mode: "bg-green-800/60 text-green-100 hover:bg-green-700 text-[10px]",
    mem: "bg-green-900/40 text-green-200 hover:bg-green-800/60 text-[10px]",
    sci: "bg-slate-700 text-cyan-300 hover:bg-slate-600",
    paren: "bg-slate-700 text-slate-200 hover:bg-slate-600",
    util: "bg-slate-700 text-slate-200 hover:bg-slate-600",
    clear: "bg-red-700 text-white hover:bg-red-600",
    del: "bg-orange-600 text-white hover:bg-orange-500",
    digit: "bg-slate-600 text-white hover:bg-slate-500",
    op: "bg-yellow-500 text-slate-900 hover:bg-yellow-400 font-bold",
    equals: "bg-green-500 text-white hover:bg-green-400 font-bold text-base",
  };

  const renderRow = (row: BtnDef[], cols: number) => (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {row.map((b) => (
        <button
          key={b.val ?? b.label}
          onClick={() => handleBtn(b.val ?? b.label)}
          aria-label={b.label}
          style={b.span ? { gridColumn: `span ${b.span}` } : undefined}
          className={`rounded-lg py-2 text-[11px] font-semibold transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400 ${vc[b.v ?? "digit"] ?? ""}`}>
          {b.label}
        </button>
      ))}
    </div>
  );

  // Hide until position is calculated to prevent flash at 0,0
  const floatStyle: React.CSSProperties = pos
    ? { position: "fixed", left: pos.x, top: pos.y, zIndex: 9999 }
    : {
        position: "fixed",
        right: INITIAL_RIGHT,
        bottom: INITIAL_BOTTOM,
        zIndex: 9999,
        visibility: "hidden",
      };

  return (
    <div ref={containerRef} style={floatStyle}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-72 overflow-hidden border border-slate-600 select-none">
        {/* ── Header / drag handle ── */}
        <div
          role="toolbar"
          aria-label="Calculator title bar — drag to reposition"
          className="bg-green-900 px-3 py-2 flex justify-between items-center cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}>
          <div className="flex items-center gap-2 pointer-events-none">
            {/* Grip dots */}
            <div className="flex flex-col gap-[3px] opacity-40" aria-hidden="true">
              <div className="flex gap-[3px]">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block w-1 h-1 rounded-full bg-white" />
                ))}
              </div>
              <div className="flex gap-[3px]">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block w-1 h-1 rounded-full bg-white" />
                ))}
              </div>
            </div>
            <span className="font-bold text-white text-xs tracking-wide">Calculator</span>
            {isShift && (
              <span className="text-[9px] bg-yellow-400 text-yellow-900 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                SHIFT
              </span>
            )}
          </div>

          {/* Buttons inside header must have pointer-events so they work */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowHistory((s) => !s)}
              aria-label={showHistory ? "Show calculator keypad" : "Show calculation history"}
              className="text-green-300 hover:text-white text-[10px] font-bold transition-colors px-1">
              {showHistory ? "CALC" : "HIST"}
            </button>
            <button
              onClick={onClose}
              aria-label="Close calculator"
              className="text-white/60 hover:text-white text-sm leading-none">
              ✕
            </button>
          </div>
        </div>

        {/* ── Display ── */}
        <div className="bg-slate-900 px-3 py-2.5 border-b border-slate-700">
          <div className="text-slate-500 text-[10px] font-mono h-3.5 text-right truncate">
            {expression || " "}
          </div>
          <div
            className={`text-right font-mono font-bold truncate mt-0.5 ${isError ? "text-red-400 text-lg" : "text-white text-2xl"}`}
            aria-live="polite"
            aria-atomic="true">
            {display}
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[9px] text-yellow-500 font-mono">{angleMode}</span>
            {hasMemory && <span className="text-[9px] text-cyan-400 font-mono">M={memory}</span>}
          </div>
        </div>

        {/* ── History panel ── */}
        {showHistory ? (
          <div className="p-2 bg-slate-800 min-h-64 max-h-72 overflow-y-auto space-y-1">
            {history.length === 0 ? (
              <p className="text-slate-500 text-xs text-center mt-6">No history yet.</p>
            ) : (
              history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDisplay(h.result);
                    setExpression("");
                    setJustEvaled(true);
                    setShowHistory(false);
                  }}
                  className="w-full text-right bg-slate-700 hover:bg-slate-600 rounded-lg px-3 py-1.5 transition-colors">
                  <div className="text-slate-400 text-[10px] font-mono truncate">{h.expr}</div>
                  <div className="text-white text-xs font-mono font-bold">{h.result}</div>
                </button>
              ))
            )}
          </div>
        ) : (
          /* ── Keypad ── */
          <div className="p-2 space-y-1 bg-slate-800">
            {renderRow(row0, 6)}
            {renderRow(row1, 6)}
            {renderRow(row2, 6)}
            {renderRow(row3, 6)}
            {numRows.map((row, i) => (
              <div key={i}>{renderRow(row, 4)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
