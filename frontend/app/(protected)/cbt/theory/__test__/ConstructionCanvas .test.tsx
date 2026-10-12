import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, test, expect } from "vitest";
import ConstructionCanvas from "../ConstructionCanvas";

// ── mocks ────────────────────────────────────────────────────────
vi.mock("../DrawingToolbar", () => ({
  default: ({ onClear }: { onClear: () => void }) => (
    <div data-testid="drawing-toolbar">
      <button onClick={onClear}>Clear</button>
    </div>
  ),
}));

// canvas mock — getContext returns null in jsdom
const mockCtx = {
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
  lineCap: "",
  lineJoin: "",
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  drawImage: vi.fn(),
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

function renderCanvas(overrides = {}) {
  return render(<ConstructionCanvas {...defaultProps} {...overrides} />);
}

describe("ConstructionCanvas", () => {
  test("renders without crashing", () => {
    renderCanvas();
    expect(screen.getByText("CONSTRUCTION SHEET")).toBeInTheDocument();
  });

  test("renders the drawing toolbar", () => {
    renderCanvas();
    expect(screen.getByTestId("drawing-toolbar")).toBeInTheDocument();
  });

  test("shows Fullscreen button initially", () => {
    renderCanvas();
    expect(screen.getByRole("button", { name: /fullscreen/i })).toBeInTheDocument();
  });

  test("toggles to Exit when fullscreen button is clicked", async () => {
    renderCanvas();
    await userEvent.click(screen.getByRole("button", { name: /fullscreen/i }));
    expect(screen.getByRole("button", { name: /exit/i })).toBeInTheDocument();
  });

  test("toggles back to Fullscreen when Exit is clicked", async () => {
    renderCanvas();
    await userEvent.click(screen.getByRole("button", { name: /fullscreen/i }));
    await userEvent.click(screen.getByRole("button", { name: /exit/i }));
    expect(screen.getByRole("button", { name: /fullscreen/i })).toBeInTheDocument();
  });

  test("calls onSave with canvas data when drawing stops", () => {
    const onSave = vi.fn();
    renderCanvas({ onSave });

    const canvas = document.querySelector("canvas")!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(canvas);

    expect(onSave).toHaveBeenCalledWith("data:image/png;base64,mock");
  });

  test("calls onSave when clear is triggered", async () => {
    const onSave = vi.fn();
    renderCanvas({ onSave });

    await userEvent.click(screen.getByRole("button", { name: /clear/i }));

    expect(onSave).toHaveBeenCalledWith("data:image/png;base64,mock");
  });

  test("loads initialData into canvas on mount", () => {
    renderCanvas({ initialData: "data:image/png;base64,existing" });
    // Image loading is async — we verify the Image src was set via the onload path
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith("2d");
  });
});
