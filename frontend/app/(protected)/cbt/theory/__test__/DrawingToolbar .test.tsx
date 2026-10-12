import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, test, expect } from "vitest";
import DrawingToolbar from "../components/DrawingToolbar";

const defaultProps = {
  tool: "draw" as const,
  setTool: vi.fn(),
  color: "#1a4a2e",
  setColor: vi.fn(),
  brushSize: 2,
  setBrushSize: vi.fn(),
  onClear: vi.fn(),
  onDownload: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

function renderToolbar(overrides = {}) {
  return render(<DrawingToolbar {...defaultProps} {...overrides} />);
}

// 1. RENDERING

describe("rendering", () => {
  test("renders Draw, Erase and Clear All buttons", () => {
    renderToolbar();
    expect(screen.getByRole("button", { name: /draw/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /erase/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear all/i })).toBeInTheDocument();
  });

  test("renders Save button", () => {
    renderToolbar();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  test("renders default color swatches", () => {
    renderToolbar();
    const defaultColors = ["#1a4a2e", "#c0392b", "#2980b9", "#8e44ad", "#e67e22", "#1a1a1a"];
    defaultColors.forEach((c) => {
      expect(screen.getByTitle(c)).toBeInTheDocument();
    });
  });

  test("renders custom colors when provided", () => {
    renderToolbar({ colors: ["#ff0000", "#00ff00"] });
    expect(screen.getByTitle("#ff0000")).toBeInTheDocument();
    expect(screen.getByTitle("#00ff00")).toBeInTheDocument();
  });

  test("renders brush size slider with correct value", () => {
    renderToolbar({ brushSize: 5 });
    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("5");
  });

  test("displays current brush size number", () => {
    renderToolbar({ brushSize: 7 });
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  test("renders extraRight content when provided", () => {
    renderToolbar({ extraRight: <button>Custom</button> });
    expect(screen.getByRole("button", { name: /custom/i })).toBeInTheDocument();
  });
});

// 2. TOOL SWITCHING

describe("tool switching", () => {
  test("calls setTool with 'draw' when Draw is clicked", async () => {
    const setTool = vi.fn();
    renderToolbar({ setTool, tool: "erase" });

    await userEvent.click(screen.getByRole("button", { name: /draw/i }));

    expect(setTool).toHaveBeenCalledWith("draw");
  });

  test("calls setTool with 'erase' when Erase is clicked", async () => {
    const setTool = vi.fn();
    renderToolbar({ setTool });

    await userEvent.click(screen.getByRole("button", { name: /erase/i }));

    expect(setTool).toHaveBeenCalledWith("erase");
  });

  test("applies active styles to Draw button when tool is draw", () => {
    renderToolbar({ tool: "draw" });
    expect(screen.getByRole("button", { name: /draw/i })).toHaveClass("bg-green-800");
  });

  test("applies active styles to Erase button when tool is erase", () => {
    renderToolbar({ tool: "erase" });
    expect(screen.getByRole("button", { name: /erase/i })).toHaveClass("bg-green-800");
  });

  test("does not apply active styles to Draw when tool is erase", () => {
    renderToolbar({ tool: "erase" });
    expect(screen.getByRole("button", { name: /draw/i })).not.toHaveClass("bg-green-800");
  });
});

// 3. COLOR SELECTION

describe("color selection", () => {
  test("calls setColor with the clicked color", async () => {
    const setColor = vi.fn();
    renderToolbar({ setColor, colors: ["#ff0000", "#00ff00"] });

    await userEvent.click(screen.getByTitle("#ff0000"));

    expect(setColor).toHaveBeenCalledWith("#ff0000");
  });

  test("calls setTool with 'draw' when a color swatch is clicked", async () => {
    const setTool = vi.fn();
    renderToolbar({ setTool, tool: "erase", colors: ["#ff0000"] });

    await userEvent.click(screen.getByTitle("#ff0000"));

    expect(setTool).toHaveBeenCalledWith("draw");
  });

  test("active color swatch has highlighted border when tool is draw", () => {
    renderToolbar({ tool: "draw", color: "#1a4a2e", colors: ["#1a4a2e"] });
    expect(screen.getByTitle("#1a4a2e")).toHaveClass("border-green-800");
  });

  test("active color swatch does not highlight when tool is erase", () => {
    renderToolbar({ tool: "erase", color: "#1a4a2e", colors: ["#1a4a2e"] });
    expect(screen.getByTitle("#1a4a2e")).not.toHaveClass("border-green-800");
  });
});

// 4. BRUSH SIZE

describe("brush size", () => {
  test("calls setBrushSize with parsed integer when slider changes", () => {
    const setBrushSize = vi.fn();
    renderToolbar({ setBrushSize });

    fireEvent.change(screen.getByRole("slider"), { target: { value: "8" } });

    expect(setBrushSize).toHaveBeenCalledWith(8);
  });

  test("slider has min of 1 and max of 14", () => {
    renderToolbar();
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "14");
  });
});

// 5. CLEAR AND DOWNLOAD

describe("clear and download", () => {
  test("calls onClear when Clear All is clicked", async () => {
    const onClear = vi.fn();
    renderToolbar({ onClear });

    await userEvent.click(screen.getByRole("button", { name: /clear all/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test("calls onDownload when Save is clicked", async () => {
    const onDownload = vi.fn();
    renderToolbar({ onDownload });

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});
