import { getEventCoords } from "@/utils/getEventCoords";
import { useCallback, useEffect, useRef, useState } from "react";
import DrawingToolbar from "./DrawingToolbar";

/* ─────────────────────────────────────────────────────────
   LINED CANVAS (Whiteboard)
───────────────────────────────────────────────────────── */
export default function LinedCanvas({
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
  const colorRef = useRef("#1a4a2e");
  const brushSizeRef = useRef(2);
  const [tool, setTool] = useState<"draw" | "erase">("draw");
  const [color, setColor] = useState("#1a4a2e");
  const [brushSize, setBrushSize] = useState(2);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  const drawLines = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.strokeStyle = "#d6e4d8";
    ctx.lineWidth = 0.8;
    for (let y = 30; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(50, h);
    ctx.strokeStyle = "#e8a87c";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 300;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fef9ef";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawLines(ctx, canvas.width, canvas.height);
    if (initialData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = initialData;
    }
  }, [drawLines, initialData]);
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
    ctx.strokeStyle = toolRef.current === "erase" ? "#fef9ef" : colorRef.current;
    ctx.lineWidth = toolRef.current === "erase" ? brushSizeRef.current * 4 : brushSizeRef.current;
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
    ctx.fillStyle = "#fef9ef";
    ctx.fillRect(0, 0, c.width, c.height);
    drawLines(ctx, c.width, c.height);
    onSave(c.toDataURL());
  };

  return (
    <div
      className="border rounded-xl overflow-hidden"
      style={{ borderColor: "rgba(30,80,50,0.15)" }}>
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
          a.download = `whiteboard-${subQuestionId}.png`;
          a.click();
        }}
      />
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
        className="w-full cursor-crosshair touch-none"
        style={{ background: "#fef9ef", minHeight: "300px" }}
      />
    </div>
  );
}
