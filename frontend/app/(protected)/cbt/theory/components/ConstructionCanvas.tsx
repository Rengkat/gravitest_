import { getEventCoords } from "@/utils/getEventCoords";
import { Maximize2, Minimize2, Ruler } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import DrawingToolbar from "./DrawingToolbar";

/* ─────────────────────────────────────────────────────────
   CONSTRUCTION CANVAS
───────────────────────────────────────────────────────── */
export default function ConstructionCanvas({
  subQuestionId,
  onSave,
  initialData,
}: {
  subQuestionId: string;
  onSave: (d: string) => void;
  initialData?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const toolRef = useRef<"draw" | "erase">("draw");
  const colorRef = useRef("#1a1a1a");
  const brushSizeRef = useRef(2);
  const [tool, setTool] = useState<"draw" | "erase">("draw");
  const [color, setColor] = useState("#1a1a1a");
  const [brushSize, setBrushSize] = useState(2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (initialData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = initialData;
    }
  }, [initialData]);
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getEventCoords(e, canvasRef.current!);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = getEventCoords(e, canvas);
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
  const stop = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const c = canvasRef.current;
    if (c) onSave(c.toDataURL());
  };
  const clearCanvas = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    onSave(c.toDataURL());
  };

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${isFullscreen ? "fixed inset-4 z-50 shadow-2xl flex flex-col" : ""}`}
      style={{ borderColor: "rgba(30,80,50,0.15)", background: "#fff" }}>
      <div className="bg-green-900 text-green-100 px-4 py-1 flex items-center gap-3 text-[11px] font-mono">
        <Ruler size={13} className="text-green-400" />
        <span className="text-green-400 font-semibold">CONSTRUCTION SHEET</span>
        <button
          onClick={() => setIsFullscreen((f) => !f)}
          className="ml-auto px-2.5 py-1 rounded border border-green-700 bg-green-800 hover:bg-green-700 transition-all text-xs flex items-center gap-1">
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          {isFullscreen ? "Exit" : "Fullscreen"}
        </button>
      </div>
      <DrawingToolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        onClear={clearCanvas}
        onDownload={() => {
          const a = document.createElement("a");
          a.href = canvasRef.current!.toDataURL("image/png");
          a.download = `construction-${subQuestionId}.png`;
          a.click();
        }}
        colors={["#1a1a1a", "#c0392b", "#2980b9", "#1a4a2e", "#8e44ad", "#e67e22", "#7f8c8d"]}
      />
      <div
        className="overflow-auto"
        style={{
          maxHeight: isFullscreen ? "calc(100vh - 120px)" : "520px",
          background: "#e8e8e8",
        }}>
        <div style={{ margin: "12px", display: "inline-block" }}>
          <canvas
            ref={canvasRef}
            onMouseDown={start}
            onMouseMove={draw}
            onMouseUp={stop}
            onMouseLeave={stop}
            onTouchStart={start}
            onTouchMove={draw}
            onTouchEnd={stop}
            className="block touch-none shadow-lg"
            style={{ cursor: "crosshair", border: "1px solid #ccc", background: "#fff" }}
          />
        </div>
      </div>
    </div>
  );
}
