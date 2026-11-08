import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionImage from "../QuestionImage";

const png = "https://pub.example.r2.dev/q/diagram.png";
const jpg = "https://pub.example.r2.dev/q/diagram.jpg";

describe("QuestionImage — layout", () => {
  it("is a bare figure: no border, no padding, no inner wrapper — the image IS the container", () => {
    const { container } = render(<QuestionImage src={jpg} alt="Question diagram" />);
    const figure = screen.getByTestId("question-image");
    expect(figure.tagName).toBe("FIGURE");
    expect(figure.className).not.toMatch(/\b(p|px|py|pt|pb)-\d/);
    expect(figure.className).not.toMatch(/\bborder/);
    expect(container.querySelectorAll("figure > *").length).toBe(1);
    expect(figure.firstElementChild?.tagName).toBe("IMG");
  });

  it("fills the container width, keeps its aspect ratio and is never cropped", () => {
    render(<QuestionImage src={jpg} alt="d" />);
    const img = screen.getByRole("img", { name: "d" });
    expect(img.className).toMatch(/(^|\s)w-full(\s|$)/);
    expect(img.className).toMatch(/(^|\s)h-auto(\s|$)/); // natural aspect ratio — no fixed height
    expect(img.className).toMatch(/object-contain/); // whole diagram visible
    expect(img.className).not.toMatch(/object-cover/);
    expect(img.className).not.toMatch(/\bh-\d/); // never a fixed height
    expect(img.className).toMatch(/max-w-full/); // cannot overflow the container
    expect(img.className).toMatch(/max-h-\[/); // tall images are capped by viewport height, not cut off
  });

  it("is lazy-loaded and has a proper accessible name", () => {
    render(<QuestionImage src={jpg} alt="Diagram for question 2" />);
    const img = screen.getByRole("img", { name: "Diagram for question 2" });
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("option images keep their natural size and are never upscaled", () => {
    render(<QuestionImage src={jpg} alt="Option A" size="option" />);
    const img = screen.getByRole("img", { name: "Option A" });
    expect(img.className).toMatch(/(^|\s)w-auto(\s|$)/);
    expect(img.className).not.toMatch(/(^|\s)w-full(\s|$)/);
    expect(img.className).toMatch(/object-contain/);
  });
});

describe("QuestionImage — backdrop (blends with the paper, survives dark mode)", () => {
  it("a white-paper diagram sits on a literal white background", () => {
    render(<QuestionImage src={jpg} alt="d" />);
    const figure = screen.getByTestId("question-image");
    expect(figure).toHaveAttribute("data-backdrop", "paper");
    // A literal colour: the theme layer remaps `bg-white` to the dark surface in dark mode,
    // which is exactly what made the white diagram look like it floated in a dark frame.
    expect(figure.className).toContain("bg-[#ffffff]");
    expect(figure.className).not.toMatch(/\bbg-white\b/);
  });

  it("is rounded so it blends with the question container", () => {
    render(<QuestionImage src={jpg} alt="d" />);
    expect(screen.getByTestId("question-image").className).toMatch(/rounded-lg/);
    expect(screen.getByTestId("question-image").className).toMatch(/overflow-hidden/);
  });

  it("can be forced transparent for images whose own background matters", () => {
    render(<QuestionImage src={png} alt="d" backdrop="transparent" />);
    const figure = screen.getByTestId("question-image");
    expect(figure).toHaveAttribute("data-backdrop", "transparent");
    expect(figure.className).toContain("bg-transparent");
    expect(figure.className).not.toContain("bg-[#ffffff]");
  });

  it("can be forced to paper", () => {
    render(<QuestionImage src={png} alt="d" backdrop="paper" />);
    expect(screen.getByTestId("question-image")).toHaveAttribute("data-backdrop", "paper");
  });

  it("JPEGs are never requested with CORS (they cannot be transparent, so there is nothing to inspect)", () => {
    render(<QuestionImage src={jpg} alt="d" />);
    expect(screen.getByRole("img")).not.toHaveAttribute("crossorigin");
  });

  it("PNG/WebP are first requested with CORS so their transparency can be inspected", () => {
    render(<QuestionImage src={png} alt="d" />);
    expect(screen.getByRole("img")).toHaveAttribute("crossorigin", "anonymous");
  });
});

describe("QuestionImage — loading failures", () => {
  it("retries a PNG without CORS before giving up (a host with no CORS headers must still show the image)", () => {
    render(<QuestionImage src={png} alt="d" />);
    expect(screen.getByRole("img")).toHaveAttribute("crossorigin", "anonymous");
    fireEvent.error(screen.getByRole("img"));
    const retried = screen.getByRole("img");
    expect(retried).not.toHaveAttribute("crossorigin");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("then shows a clear message with a working Retry button", async () => {
    render(<QuestionImage src={jpg} alt="d" />);
    fireEvent.error(screen.getByRole("img"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be loaded/i);
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(screen.getByRole("img", { name: "d" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
