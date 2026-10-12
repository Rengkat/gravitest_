import { render, screen, fireEvent } from "@testing-library/react";
import InstructionsPage from "../components/Instructions";
import { describe, test, expect, vi } from "vitest";

describe("InstructionsPage", () => {
  test("calls onStart when Start Examination button is clicked", () => {
    const onStart = vi.fn();
    render(<InstructionsPage onStart={onStart} />);

    fireEvent.click(screen.getByText("Start Examination"));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
