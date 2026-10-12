import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import StepIndicator from "../StepIndicator";

describe("StepIndicator", () => {
  // ───────────────────────────────────────────
  // Labels
  // ───────────────────────────────────────────
  describe("Labels", () => {
    test("renders all three step labels", () => {
      render(<StepIndicator current={1} />);

      expect(screen.getByText("Account Type")).toBeInTheDocument();
      expect(screen.getByText("Your Details")).toBeInTheDocument();
      expect(screen.getByText("Verify")).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────
  // Step numbers vs check icons
  // ───────────────────────────────────────────
  describe("Step numbers and check icons", () => {
    test("current=1: shows numbers 1,2,3 — no check icons", () => {
      render(<StepIndicator current={1} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();

      // No step is done yet — no check icons
      expect(document.querySelectorAll(".lucide-check")).toHaveLength(0);
    });

    test("current=2: step 1 shows check icon, steps 2 and 3 show numbers", () => {
      render(<StepIndicator current={2} />);

      // Step 1 is done
      expect(document.querySelectorAll(".lucide-check")).toHaveLength(1);

      // Steps 2 and 3 still show numbers
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    test("current=3: steps 1 and 2 show check icons, step 3 shows number", () => {
      render(<StepIndicator current={3} />);

      expect(document.querySelectorAll(".lucide-check")).toHaveLength(2);
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────
  // Circle styling — active, done, future
  // ───────────────────────────────────────────
  describe("Circle styling", () => {
    test("current=1: step 1 circle is active (bg-green-800), steps 2 and 3 are future", () => {
      render(<StepIndicator current={1} />);

      // Each step number/icon sits inside its circle div
      // Grab all circles — they share the w-9 h-9 rounded-full class
      const circles = document.querySelectorAll(".w-9.h-9.rounded-full");
      expect(circles).toHaveLength(3);

      expect(circles[0].className).toContain("bg-green-800"); // active
      expect(circles[1].className).toContain("border-green-900/20"); // future
      expect(circles[2].className).toContain("border-green-900/20"); // future
    });

    test("current=2: step 1 circle is done (bg-green-500), step 2 is active, step 3 is future", () => {
      render(<StepIndicator current={2} />);

      const circles = document.querySelectorAll(".w-9.h-9.rounded-full");

      expect(circles[0].className).toContain("bg-green-500"); // done
      expect(circles[1].className).toContain("bg-green-800"); // active
      expect(circles[2].className).toContain("border-green-900/20"); // future
    });

    test("current=3: steps 1 and 2 are done, step 3 is active", () => {
      render(<StepIndicator current={3} />);

      const circles = document.querySelectorAll(".w-9.h-9.rounded-full");

      expect(circles[0].className).toContain("bg-green-500"); // done
      expect(circles[1].className).toContain("bg-green-500"); // done
      expect(circles[2].className).toContain("bg-green-800"); // active
    });
  });

  // ───────────────────────────────────────────
  // Label styling — active/done vs future
  // ───────────────────────────────────────────
  describe("Label styling", () => {
    test("current=1: only Account Type label has active colour", () => {
      render(<StepIndicator current={1} />);

      const activeLabel = screen.getByText("Account Type");
      const futureLabel1 = screen.getByText("Your Details");
      const futureLabel2 = screen.getByText("Verify");

      expect(activeLabel.className).toContain("text-green-800");
      expect(futureLabel1.className).toContain("text-green-900/40");
      expect(futureLabel2.className).toContain("text-green-900/40");
    });

    test("current=2: Account Type and Your Details labels are active colour", () => {
      render(<StepIndicator current={2} />);

      expect(screen.getByText("Account Type").className).toContain("text-green-800");
      expect(screen.getByText("Your Details").className).toContain("text-green-800");
      expect(screen.getByText("Verify").className).toContain("text-green-900/40");
    });

    test("current=3: all labels have active colour", () => {
      render(<StepIndicator current={3} />);

      expect(screen.getByText("Account Type").className).toContain("text-green-800");
      expect(screen.getByText("Your Details").className).toContain("text-green-800");
      expect(screen.getByText("Verify").className).toContain("text-green-800");
    });
  });

  // ───────────────────────────────────────────
  // Connector bars
  // ───────────────────────────────────────────
  describe("Connector bars", () => {
    test("renders exactly 2 connector bars (not after last step)", () => {
      render(<StepIndicator current={1} />);

      // Connectors share the h-0.5 mx-1 mb-4 classes
      const connectors = document.querySelectorAll(".h-0\\.5.mx-1.mb-4");
      expect(connectors).toHaveLength(2);
    });

    test("current=1: both connectors are future colour (bg-green-900/10)", () => {
      render(<StepIndicator current={1} />);

      const connectors = document.querySelectorAll(".h-0\\.5.mx-1.mb-4");
      connectors.forEach((c) => {
        expect(c.className).toContain("bg-green-900/10");
      });
    });

    test("current=2: first connector is done (bg-green-500), second is future", () => {
      render(<StepIndicator current={2} />);

      const connectors = document.querySelectorAll(".h-0\\.5.mx-1.mb-4");
      expect(connectors[0].className).toContain("bg-green-500");
      expect(connectors[1].className).toContain("bg-green-900/10");
    });

    test("current=3: both connectors are done (bg-green-500)", () => {
      render(<StepIndicator current={3} />);

      const connectors = document.querySelectorAll(".h-0\\.5.mx-1.mb-4");
      connectors.forEach((c) => {
        expect(c.className).toContain("bg-green-500");
      });
    });
  });
});
