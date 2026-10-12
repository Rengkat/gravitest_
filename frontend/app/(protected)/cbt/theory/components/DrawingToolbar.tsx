import { Download, Eraser, PenTool } from "lucide-react";

interface DrawingToolbarProps {
  tool: "draw" | "erase";
  setTool: (t: "draw" | "erase") => void;
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  onClear: () => void;
  onDownload: () => void;
  colors?: string[];
  extraRight?: React.ReactNode;
}

export default function DrawingToolbar({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  onClear,
  onDownload,
  colors = ["#1a4a2e", "#c0392b", "#2980b9", "#8e44ad", "#e67e22", "#1a1a1a"],
  extraRight,
}: DrawingToolbarProps) {
  return (
    <div className="bg-gray-50 p-2.5 flex flex-wrap gap-2 items-center border-b">
      <button
        onClick={() => setTool("draw")}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${tool === "draw" ? "bg-green-800 text-white shadow-sm" : "bg-white border hover:bg-gray-100"}`}>
        <PenTool size={13} />
        Draw
      </button>
      <button
        onClick={() => setTool("erase")}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${tool === "erase" ? "bg-green-800 text-white shadow-sm" : "bg-white border hover:bg-gray-100"}`}>
        <Eraser size={13} />
        Erase
      </button>
      <button
        onClick={onClear}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all">
        Clear All
      </button>
      <div className="h-5 w-px bg-gray-300 mx-0.5" />
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => {
            setColor(c);
            setTool("draw");
          }}
          title={c}
          className={`w-6 h-6 rounded-full border-2 transition-all ${color === c && tool === "draw" ? "border-green-800 scale-110 shadow-md" : "border-gray-300 hover:scale-105"}`}
          style={{ backgroundColor: c }}
        />
      ))}
      <div className="h-5 w-px bg-gray-300 mx-0.5" />
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500 font-medium">Size:</span>
        <input
          title="brush"
          type="range"
          min="1"
          max="14"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-20 accent-green-800"
        />
        <span className="text-[11px] text-gray-500 w-4">{brushSize}</span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        {extraRight}
        <button
          onClick={onDownload}
          title="Download"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border hover:bg-green-50 hover:border-green-400 hover:text-green-700 flex items-center gap-1.5 transition-all">
          <Download size={13} />
          Save
        </button>
      </div>
    </div>
  );
}
