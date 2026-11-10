import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionImage from "../QuestionImage";

const png = "https://pub.example.r2.dev/q/diagram.png";
const jpg = "https://pub.example.r2.dev/q/diagram.jpg";

describe("QuestionImage — layout", () => {
  it("is a bare figure: no border, no padding, no wrapper chrome — the image IS the container", () => {
    render(<QuestionImage src={jpg} alt="Question diagram" />);
    const figure = screen.getByTestId("question-image");
    expect(figure.tagName).toBe("FIGURE");
    expect(figure.className).not.toMatch(/(^|\s)(p|px|py|pt|pb)-\d/);
    expect(figure.className).not.toMatch(/\bborder/);
    // The only child is the (unstyled) button that makes it enlargeable; the image is directly inside it.
    expect(figure.children).toHaveLength(1);
    const button = figure.firstElementChild!;
    expect(button.tagName).toBe("BUTTON");
    expect(button.className).not.toMatch(/(^|\s)(p|px|py|m|mx|my)-\d|border|bg-/);
    expect(button.children).toHaveLength(1);
    expect(button.firstElementChild?.tagName).toBe("IMG");
  });

  it("the paper band spans the full width of the question, with the diagram centred and modest in height", () => {
    render(<QuestionImage src={jpg} alt="d" />);
    const figure = screen.getByTestId("question-image");
    expect(figure.className).toMatch(/(^|\s)w-full(\s|$)/); // the white band covers the whole width
    expect(figure.className).not.toMatch(/w-fit/);
    const img = screen.getByRole("img", { name: "d" });
    expect(img.className).toMatch(/mx-auto/); // centred inside the band
    expect(img.className).toMatch(/max-h-\[min\(36vh,17rem\)\]/); // but never takes over the page
    expect(img.className).toMatch(/(^|\s)w-auto(\s|$)/); // and is never upscaled/stretched
  });

  it("a graph is allowed more height than a diagram — still never cropped", () => {
    const { rerender } = render(<QuestionImage src={jpg} alt="d" kind="diagram" />);
    expect(screen.getByRole("img", { name: "d" }).className).toMatch(/max-h-\[min\(36vh,17rem\)\]/);
    expect(screen.getByTestId("question-image")).toHaveAttribute("data-kind", "diagram");
    rerender(<QuestionImage src={jpg} alt="d" kind="graph" />);
    const img = screen.getByRole("img", { name: "d" });
    expect(img.className).toMatch(/max-h-\[min\(62vh,30rem\)\]/);
    expect(img.className).toMatch(/object-contain/);
    expect(screen.getByTestId("question-image")).toHaveAttribute("data-kind", "graph");
  });

  it("with no way to inspect the pixels it falls back to the compact diagram size", () => {
    render(<QuestionImage src={jpg} alt="d" />);
    expect(screen.getByTestId("question-image")).toHaveAttribute("data-kind", "diagram");
  });

  it("keeps its aspect ratio and is never cropped", () => {
    render(<QuestionImage src={jpg} alt="d" />);
    const img = screen.getByRole("img", { name: "d" });
    expect(img.className).toMatch(/(^|\s)h-auto(\s|$)/); // natural aspect ratio — no fixed height
    expect(img.className).toMatch(/object-contain/); // whole diagram visible
    expect(img.className).not.toMatch(/object-cover/);
    expect(img.className).not.toMatch(/(^|\s)h-\d/); // never a fixed height
    expect(img.className).toMatch(/max-w-full/); // cannot overflow the container
  });

  it("compact and option sizes are smaller still, and hug their image instead of spanning the width", () => {
    const { rerender } = render(<QuestionImage src={jpg} alt="d" size="compact" />);
    expect(screen.getByRole("img", { name: "d" }).className).toMatch(/max-h-36/);
    expect(screen.getByTestId("question-image").className).toMatch(/w-fit/);
    rerender(<QuestionImage src={jpg} alt="d" size="option" />);
    expect(screen.getByRole("img", { name: "d" }).className).toMatch(/max-h-32/);
  });

  it("is lazy-loaded and has a proper accessible name", () => {
    render(<QuestionImage src={jpg} alt="Diagram for question 2" />);
    const img = screen.getByRole("img", { name: "Diagram for question 2" });
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("images are never upscaled beyond their own size (width is auto)", () => {
    render(<QuestionImage src={jpg} alt="Option A" size="option" />);
    const img = screen.getByRole("img", { name: "Option A" });
    expect(img.className).toMatch(/(^|\s)w-auto(\s|$)/);
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

  it("question images are requested with CORS (JPEGs too) so their pixels can be checked for graph axes", () => {
    render(<QuestionImage src="https://cors-ok.example.com/a.jpg" alt="d" />);
    expect(screen.getByRole("img")).toHaveAttribute("crossorigin", "anonymous");
  });

  it("small images (options, thumbnails) that cannot be transparent are not requested with CORS", () => {
    render(<QuestionImage src="https://cors-ok.example.com/o.jpg" alt="d" size="option" />);
    expect(screen.getByRole("img")).not.toHaveAttribute("crossorigin");
  });

  it("a host that refuses CORS is remembered: later images from it skip the failed attempt", () => {
    const first = render(<QuestionImage src="https://no-cors.example.com/a.jpg" alt="first" />);
    fireEvent.error(screen.getByRole("img", { name: "first" })); // CORS refused → falls back
    expect(screen.getByRole("img", { name: "first" })).not.toHaveAttribute("crossorigin");
    first.unmount();

    render(<QuestionImage src="https://no-cors.example.com/b.jpg" alt="second" />);
    expect(screen.getByRole("img", { name: "second" })).not.toHaveAttribute("crossorigin");
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

describe("QuestionImage — click to enlarge", () => {
  it("the thumbnail is a labelled button that opens the image full-size in a dialog", async () => {
    render(<QuestionImage src={jpg} alt="Question diagram" />);
    await userEvent.click(screen.getByRole("button", { name: /view larger: question diagram/i }));
    const dialog = await screen.findByRole("dialog", { name: "Question diagram" });
    expect(dialog.querySelector("img")).toHaveAttribute("src", jpg);
    expect(dialog.querySelector("img")?.className).toMatch(/object-contain/); // enlarged, still never cropped
  });

  it("closes with Escape, and with the Close button", async () => {
    render(<QuestionImage src={jpg} alt="Question diagram" />);
    await userEvent.click(screen.getByRole("button", { name: /view larger/i }));
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /view larger/i }));
    await userEvent.click(await screen.findByRole("button", { name: /close enlarged image/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is reachable and operable from the keyboard alone", async () => {
    render(<QuestionImage src={jpg} alt="Question diagram" />);
    await userEvent.tab();
    expect(screen.getByRole("button", { name: /view larger/i })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("Escape in the enlarged view does not leak to a surrounding dialog's key handling", async () => {
    let outer = 0;
    render(
      <div onKeyDown={() => (outer += 1)}>
        <QuestionImage src={jpg} alt="Question diagram" />
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: /view larger/i }));
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(outer).toBe(0);
  });

  it("can be switched off", () => {
    render(<QuestionImage src={jpg} alt="d" enlargeable={false} />);
    expect(screen.queryByRole("button", { name: /view larger/i })).toBeNull();
    expect(screen.getByRole("img", { name: "d" })).toBeInTheDocument();
  });
});
