import { getEventCoords } from "@/utils/getEventCoords";
import {
  Crosshair,
  Download,
  Eraser,
  Hash,
  Maximize2,
  Minimize2,
  PenTool,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────
   GRAPH CANVAS  (unchanged from original)
───────────────────────────────────────────────────────── */
type GraphMode = "draw" | "erase" | "point" | "crosshair";
const GRID = {
  majorSize: 50,
  minorDivs: 5,
  cols: 16,
  rows: 12,
  marginLeft: 50,
  marginTop: 30,
  marginRight: 20,
  marginBottom: 40,
} as const;

export default function GraphCanvas({
  subQuestionId,
  onSave,
  initialData,
}: {
  subQuestionId: string;
  onSave: (d: string) => void;
  initialData?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const toolRef = useRef<GraphMode>("draw");
  const colorRef = useRef("#c0392b");
  const brushSizeRef = useRef(2);
  const overlayInitRef = useRef(false);
  const [tool, setTool] = useState<GraphMode>("draw");
  const [color, setColor] = useState("#c0392b");
  const [brushSize, setBrushSize] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  const drawGraphSheet = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      const { majorSize, minorDivs, cols, rows, marginLeft, marginTop } = GRID;
      const minorSize = majorSize / minorDivs;
      const gridW = cols * majorSize;
      const gridH = rows * majorSize;
      ctx.strokeStyle = "#c8dfc8";
      ctx.lineWidth = 0.4;
      for (let x = 0; x <= cols * minorDivs; x++) {
        ctx.beginPath();
        ctx.moveTo(marginLeft + x * minorSize, marginTop);
        ctx.lineTo(marginLeft + x * minorSize, marginTop + gridH);
        ctx.stroke();
      }
      for (let y = 0; y <= rows * minorDivs; y++) {
        ctx.beginPath();
        ctx.moveTo(marginLeft, marginTop + y * minorSize);
        ctx.lineTo(marginLeft + gridW, marginTop + y * minorSize);
        ctx.stroke();
      }
      ctx.strokeStyle = "#5aaa5a";
      ctx.lineWidth = 0.9;
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(marginLeft + x * majorSize, marginTop);
        ctx.lineTo(marginLeft + x * majorSize, marginTop + gridH);
        ctx.stroke();
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(marginLeft, marginTop + y * majorSize);
        ctx.lineTo(marginLeft + gridW, marginTop + y * majorSize);
        ctx.stroke();
      }
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(marginLeft, marginTop + gridH);
      ctx.lineTo(marginLeft + gridW, marginTop + gridH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(marginLeft, marginTop);
      ctx.lineTo(marginLeft, marginTop + gridH);
      ctx.stroke();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.moveTo(marginLeft + gridW + 8, marginTop + gridH);
      ctx.lineTo(marginLeft + gridW, marginTop + gridH - 4);
      ctx.lineTo(marginLeft + gridW, marginTop + gridH + 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(marginLeft, marginTop - 8);
      ctx.lineTo(marginLeft - 4, marginTop);
      ctx.lineTo(marginLeft + 4, marginTop);
      ctx.fill();
      if (showLabels) {
        ctx.fillStyle = "#333";
        ctx.font = "bold 11px 'Courier New',monospace";
        ctx.textAlign = "center";
        for (let x = 0; x <= cols; x++) {
          if (x % 2 === 0)
            ctx.fillText(String(x), marginLeft + x * majorSize, marginTop + gridH + 18);
        }
        ctx.textAlign = "right";
        for (let y = 0; y <= rows; y++) {
          if (y % 2 === 0)
            ctx.fillText(String(rows - y), marginLeft - 6, marginTop + y * majorSize + 4);
        }
        ctx.fillStyle = "#1a4a2e";
        ctx.font = "bold 12px 'Courier New',monospace";
        ctx.textAlign = "center";
        ctx.fillText("x", marginLeft + gridW + 18, marginTop + gridH + 4);
        ctx.textAlign = "left";
        ctx.fillText("y", marginLeft + 6, marginTop - 12);
      }
      ctx.fillStyle = "#555";
      ctx.font = "10px 'Courier New',monospace";
      ctx.textAlign = "right";
      ctx.fillText("0", marginLeft - 4, marginTop + gridH + 14);
      ctx.restore();
    },
    [showLabels],
  );

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas) return;
    const { cols, rows, majorSize, marginLeft, marginTop, marginRight, marginBottom } = GRID;
    const w = cols * majorSize + marginLeft + marginRight + 20;
    const h = rows * majorSize + marginTop + marginBottom;
    canvas.width = w;
    canvas.height = h;
    if (overlay && !overlayInitRef.current) {
      overlay.width = w;
      overlay.height = h;
      overlayInitRef.current = true;
    }
    const ctx = canvas.getContext("2d")!;
    drawGraphSheet(ctx, w, h);
    if (initialData) {
      const img = new Image();
      img.onload = () => canvas.getContext("2d")?.drawImage(img, 0, 0);
      img.src = initialData;
    }
  }, [drawGraphSheet, initialData]);
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL();
    const ctx = canvas.getContext("2d")!;
    drawGraphSheet(ctx, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = snapshot;
  }, [showLabels, drawGraphSheet]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    return getEventCoords(e, canvas);
  };
  const getGridCoords = (cx: number, cy: number) => {
    const { majorSize, marginLeft, marginTop, rows } = GRID;
    return {
      gx: Math.round(((cx - marginLeft) / majorSize) * 10) / 10,
      gy: Math.round((rows - (cy - marginTop) / majorSize) * 10) / 10,
    };
  };
  const plotPoint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = colorRef.current;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    onSave(canvasRef.current!.toDataURL());
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoords(e);
    const { gx, gy } = getGridCoords(x, y);
    setCursorPos({ x: gx, y: gy });
    if (toolRef.current === "crosshair") {
      const overlay = overlayRef.current;
      const canvas = canvasRef.current;
      if (!overlay || !canvas) return;
      if (overlay.width !== canvas.width) overlay.width = canvas.width;
      if (overlay.height !== canvas.height) overlay.height = canvas.height;
      const octx = overlay.getContext("2d")!;
      octx.clearRect(0, 0, overlay.width, overlay.height);
      octx.setLineDash([4, 4]);
      octx.strokeStyle = "rgba(41,128,185,0.7)";
      octx.lineWidth = 1;
      octx.beginPath();
      octx.moveTo(x, 0);
      octx.lineTo(x, overlay.height);
      octx.stroke();
      octx.beginPath();
      octx.moveTo(0, y);
      octx.lineTo(overlay.width, y);
      octx.stroke();
      octx.setLineDash([]);
    }
    if (!isDrawingRef.current) return;
    if (toolRef.current !== "draw" && toolRef.current !== "erase") return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = toolRef.current === "erase" ? "#ffffff" : colorRef.current;
    ctx.lineWidth = toolRef.current === "erase" ? brushSizeRef.current * 5 : brushSizeRef.current;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPosRef.current = { x, y };
  };
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCoords(e);
    if (toolRef.current === "point") {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) plotPoint(ctx, x, y);
      return;
    }
    if (toolRef.current === "crosshair") return;
    isDrawingRef.current = true;
    lastPosRef.current = { x, y };
  };
  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && (toolRef.current === "draw" || toolRef.current === "erase"))
      onSave(canvas.toDataURL());
  };
  const handleMouseLeave = () => {
    isDrawingRef.current = false;
    setCursorPos(null);
    const overlay = overlayRef.current;
    if (overlay) {
      const octx = overlay.getContext("2d");
      if (octx) octx.clearRect(0, 0, overlay.width, overlay.height);
    }
  };
  const clearGraph = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawGraphSheet(ctx, canvas.width, canvas.height);
    onSave(canvas.toDataURL());
  };

  const tools: { id: GraphMode; label: string; icon: React.ReactNode; title: string }[] = [
    { id: "draw", label: "Draw", icon: <PenTool size={13} />, title: "Free draw" },
    { id: "erase", label: "Erase", icon: <Eraser size={13} />, title: "Erase" },
    { id: "point", label: "Plot Point", icon: <Hash size={13} />, title: "Plot point" },
    { id: "crosshair", label: "Read", icon: <Crosshair size={13} />, title: "Read coords" },
  ];
  const plotColors = ["#c0392b", "#2980b9", "#1a4a2e", "#8e44ad", "#e67e22", "#1a1a1a"];
  const cursorStyle = tool === "crosshair" ? "crosshair" : tool === "point" ? "cell" : "crosshair";

  return (
    <div
      ref={containerRef}
      className={`border rounded-xl overflow-hidden transition-all ${isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : ""}`}
      style={{ borderColor: "rgba(30,80,50,0.15)", background: "#fff" }}>
      <div className="bg-gray-50 border-b p-2.5 flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.title}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${tool === t.id ? "bg-green-800 text-white shadow-sm" : "bg-white border hover:bg-gray-100"}`}>
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-gray-300" />
        {plotColors.map((c) => (
          <button
            title="color"
            key={c}
            onClick={() => {
              setColor(c);
              if (tool === "erase" || tool === "crosshair") setTool("draw");
            }}
            className={`w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 ${color === c ? "border-green-800 scale-110 shadow" : "border-gray-300 hover:scale-105"}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="h-5 w-px bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">Pen:</span>
          <input
            title="set brush size"
            type="range"
            min="1"
            max="10"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-16 accent-green-800"
          />
        </div>
        <div className="h-5 w-px bg-gray-300" />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded border bg-white hover:bg-gray-100 transition-all"
            title="Zoom out">
            <ZoomOut size={13} />
          </button>
          <span className="text-[11px] font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
            className="p-1.5 rounded border bg-white hover:bg-gray-100 transition-all"
            title="Zoom in">
            <ZoomIn size={13} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded border bg-white hover:bg-gray-100 transition-all"
            title="Reset zoom">
            <RotateCcw size={13} />
          </button>
        </div>
        <div className="h-5 w-px bg-gray-300" />
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-medium text-gray-600">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="accent-green-800 w-3.5 h-3.5"
          />
          Labels
        </label>
        <div className="ml-auto flex gap-1">
          <button
            onClick={clearGraph}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all">
            Clear
          </button>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = canvasRef.current!.toDataURL("image/png");
              a.download = `graph-${subQuestionId}.png`;
              a.click();
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border hover:bg-green-50 hover:text-green-700 hover:border-green-400 flex items-center gap-1 transition-all">
            <Download size={12} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setIsFullscreen((f) => !f)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border hover:bg-gray-100 transition-all"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>
      <div className="bg-green-900 text-green-100 px-4 py-1 flex items-center gap-4 text-[11px] font-mono">
        <span className="text-green-400 font-semibold">GRAPH SHEET</span>
        <span>|</span>
        {cursorPos ? (
          <>
            <span>
              x = <strong className="text-white">{cursorPos.x.toFixed(1)}</strong>
            </span>
            <span>
              y = <strong className="text-white">{cursorPos.y.toFixed(1)}</strong>
            </span>
          </>
        ) : (
          <span className="text-green-500">Hover to read coordinates</span>
        )}
        <span className="ml-auto text-green-400">
          {tool === "point" && "Click to plot a data point"}
          {tool === "crosshair" && "Move to read coordinates"}
          {tool === "draw" && "Draw freely on graph"}
          {tool === "erase" && "Erase drawn marks"}
        </span>
      </div>
      <div
        className="overflow-auto"
        style={{
          maxHeight: isFullscreen ? "calc(100vh - 160px)" : "480px",
          background: "#f0f4f0",
        }}>
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            display: "inline-block",
            margin: "12px",
          }}>
          <div className="relative" style={{ display: "inline-block" }}>
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              className="block touch-none shadow-lg"
              style={{ cursor: cursorStyle, border: "1px solid #ccc" }}
            />
            <canvas
              ref={overlayRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ opacity: tool === "crosshair" ? 1 : 0 }}
            />
          </div>
        </div>
      </div>
      <div className="bg-gray-50 border-t px-4 py-2 flex flex-wrap gap-4 text-[11px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-6" style={{ background: "#5aaa5a", height: "2px" }} />
          <span>Major grid (1 unit)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6" style={{ background: "#c8dfc8", height: "1px" }} />
          <span>Minor grid (0.2 unit)</span>
        </div>
        <div className="ml-auto text-[11px] text-gray-400">
          16×12 major squares · 5 minor divisions each
        </div>
      </div>
    </div>
  );
}
