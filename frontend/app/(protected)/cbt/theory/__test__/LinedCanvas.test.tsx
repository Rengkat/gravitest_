import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, beforeEach, describe, test, expect } from "vitest";
import LinedCanvas from "../components/LinedCanvas";

// ── mocks ─────────────────────────────────────────────────────────
vi.mock("../DrawingToolbar", () => ({
  default: ({ onClear }: { onClear: () => void }) => (
    <div data-testid="drawing-toolbar">
      <button onClick={onClear}>Clear</button>
    </div>
  ),
}));

const mockCtx = {
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
  lineCap: "",
  lineJoin: "",
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
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
  return render(<LinedCanvas {...defaultProps} {...overrides} />);
}

// ════════════════════════════════════════════════════════════════

describe("LinedCanvas", () => {
  test("renders without crashing", () => {
    renderCanvas();
    expect(document.querySelector("canvas")).toBeInTheDocument();
  });

  test("renders the drawing toolbar", () => {
    renderCanvas();
    expect(screen.getByTestId("drawing-toolbar")).toBeInTheDocument();
  });

  test("calls onSave with canvas data when drawing stops via mouseUp", () => {
    const onSave = vi.fn();
    renderCanvas({ onSave });

    const canvas = document.querySelector("canvas")!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(canvas);

    expect(onSave).toHaveBeenCalledWith("data:image/png;base64,mock");
  });

  test("calls onSave when drawing stops via mouseLeave", () => {
    const onSave = vi.fn();
    renderCanvas({ onSave });

    const canvas = document.querySelector("canvas")!;
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseLeave(canvas);

    expect(onSave).toHaveBeenCalledWith("data:image/png;base64,mock");
  });

  test("does not call onSave on mouseUp if drawing never started", () => {
    const onSave = vi.fn();
    renderCanvas({ onSave });

    fireEvent.mouseUp(document.querySelector("canvas")!);

    expect(onSave).not.toHaveBeenCalled();
  });

  test("calls onSave when Clear is triggered from toolbar", async () => {
    const onSave = vi.fn();
    renderCanvas({ onSave });

    await userEvent.click(screen.getByRole("button", { name: /clear/i }));

    expect(onSave).toHaveBeenCalledWith("data:image/png;base64,mock");
  });

  test("initialises canvas context on mount", () => {
    renderCanvas();
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith("2d");
  });
});
