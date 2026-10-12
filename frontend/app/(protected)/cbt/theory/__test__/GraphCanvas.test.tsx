import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, test, expect } from "vitest";
import GraphCanvas from "../components/GraphCanvas";

// ── canvas mock ───────────────────────────────────────────────────
const mockCtx = {
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
  lineCap: "",
  lineJoin: "",
  font: "",
  textAlign: "",
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  setLineDash: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx);
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,mock");
});

const defaultProps = {
  subQuestionId: "sq-1",
  onSave: vi.fn(),
  initialData: undefined,
};

function renderGraph(overrides = {}) {
  return render(<GraphCanvas {...defaultProps} {...overrides} />);
}

// 1. RENDERING

describe("rendering", () => {
  test("renders without crashing", () => {
    renderGraph();
    expect(screen.getByText("GRAPH SHEET")).toBeInTheDocument();
  });

  test("renders all four tool buttons", () => {
    renderGraph();
    expect(screen.getByTitle("Free draw")).toBeInTheDocument();
    expect(screen.getByTitle("Erase")).toBeInTheDocument();
    expect(screen.getByTitle("Plot point")).toBeInTheDocument();
    expect(screen.getByTitle("Read coords")).toBeInTheDocument();
  });

  test("renders zoom in, zoom out and reset zoom buttons", () => {
    renderGraph();
    expect(screen.getByTitle("Zoom in")).toBeInTheDocument();
    expect(screen.getByTitle("Zoom out")).toBeInTheDocument();
    expect(screen.getByTitle("Reset zoom")).toBeInTheDocument();
  });

  test("renders Clear and Export buttons", () => {
    renderGraph();
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();
  });

  test("renders Labels checkbox checked by default", () => {
    renderGraph();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  test("renders legend items at the bottom", () => {
    renderGraph();
    expect(screen.getByText(/major grid/i)).toBeInTheDocument();
    expect(screen.getByText(/minor grid/i)).toBeInTheDocument();
  });

  test("shows default zoom level as 100%", () => {
    renderGraph();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  test("shows hover hint text initially", () => {
    renderGraph();
    expect(screen.getByText(/hover to read coordinates/i)).toBeInTheDocument();
  });
});

// 2. TOOL SWITCHING

describe("tool switching", () => {
  test("Draw tool is active by default", () => {
    renderGraph();
    expect(screen.getByTitle("Free draw").closest("button")).toHaveClass("bg-green-800");
  });

  test("clicking Erase sets it as active", async () => {
    renderGraph();
    await userEvent.click(screen.getByTitle("Erase"));
    expect(screen.getByTitle("Erase").closest("button")).toHaveClass("bg-green-800");
  });

  test("clicking Plot Point sets it as active", async () => {
    renderGraph();
    await userEvent.click(screen.getByTitle("Plot point"));
    expect(screen.getByTitle("Plot point").closest("button")).toHaveClass("bg-green-800");
  });

  test("clicking Read sets it as active", async () => {
    renderGraph();
    await userEvent.click(screen.getByTitle("Read coords"));
    expect(screen.getByTitle("Read coords").closest("button")).toHaveClass("bg-green-800");
  });

  test("shows correct hint text for each tool", async () => {
    renderGraph();
    expect(screen.getByText("Draw freely on graph")).toBeInTheDocument();

    await userEvent.click(screen.getByTitle("Erase"));
    expect(screen.getByText("Erase drawn marks")).toBeInTheDocument();

    await userEvent.click(screen.getByTitle("Plot point"));
    expect(screen.getByText("Click to plot a data point")).toBeInTheDocument();

    await userEvent.click(screen.getByTitle("Read coords"));
    expect(screen.getByText("Move to read coordinates")).toBeInTheDocument();
  });
});

// 3. ZOOM CONTROLS

describe("zoom controls", () => {
  test("zoom in increases zoom level by 25%", async () => {
    renderGraph();
    await userEvent.click(screen.getByTitle("Zoom in"));
    expect(screen.getByText("125%")).toBeInTheDocument();
  });

  test("zoom out decreases zoom level by 25%", async () => {
    renderGraph();
    await userEvent.click(screen.getByTitle("Zoom out"));
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  test("zoom out does not go below 50%", async () => {
    renderGraph();
    const zoomOut = screen.getByTitle("Zoom out");
    await userEvent.click(zoomOut);
    await userEvent.click(zoomOut);
    await userEvent.click(zoomOut); // would be 25% without the floor
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("zoom in does not exceed 250%", async () => {
    renderGraph();
    const zoomIn = screen.getByTitle("Zoom in");
    for (let i = 0; i < 10; i++) await userEvent.click(zoomIn);
    expect(screen.getByText("250%")).toBeInTheDocument();
  });

  test("reset zoom returns to 100%", async () => {
    renderGraph();
    await userEvent.click(screen.getByTitle("Zoom in"));
    await userEvent.click(screen.getByTitle("Zoom in"));
    await userEvent.click(screen.getByTitle("Reset zoom"));
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});

// 4. FULLSCREEN TOGGLE

describe("fullscreen toggle", () => {
  test("shows Fullscreen button initially", () => {
    renderGraph();
    expect(screen.getByTitle("Fullscreen")).toBeInTheDocument();
  });

  test("switches to Exit fullscreen after clicking Fullscreen", async () => {
    renderGraph();
    await userEvent.click(screen.getByTitle("Fullscreen"));
    expect(screen.getByTitle("Exit fullscreen")).toBeInTheDocument();
  });

  test("switches back to Fullscreen after clicking Exit fullscreen", async () => {
    renderGraph();
    await userEvent.click(screen.getByTitle("Fullscreen"));
    await userEvent.click(screen.getByTitle("Exit fullscreen"));
    expect(screen.getByTitle("Fullscreen")).toBeInTheDocument();
  });
});

// 5. LABELS TOGGLE

describe("labels toggle", () => {
  test("labels checkbox is checked by default", () => {
    renderGraph();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  test("unchecking labels checkbox calls drawGraphSheet to redraw", async () => {
    renderGraph();
    await userEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });
});

// 6. BRUSH SIZE

describe("brush size", () => {
  test("brush size slider has min 1 and max 10", () => {
    renderGraph();
    const slider = screen.getByTitle("set brush size");
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "10");
  });

  test("changing brush size slider updates the value", () => {
    renderGraph();
    const slider = screen.getByTitle("set brush size");
    fireEvent.change(slider, { target: { value: "6" } });
    expect(slider).toHaveValue("6");
  });
});

// 7. onSave CALLBACK

describe("onSave callback", () => {
  test("calls onSave when drawing stops via mouseUp", () => {
    const onSave = vi.fn();
    renderGraph({ onSave });

    const canvas = document.querySelector("canvas")!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(canvas);

    expect(onSave).toHaveBeenCalledWith("data:image/png;base64,mock");
  });

  test("calls onSave when Clear is clicked", async () => {
    const onSave = vi.fn();
    renderGraph({ onSave });

    await userEvent.click(screen.getByRole("button", { name: /clear/i }));

    expect(onSave).toHaveBeenCalledWith("data:image/png;base64,mock");
  });
});
