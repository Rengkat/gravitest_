import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { InlineScript } from "../InlineScript";

describe("InlineScript", () => {
  it("renders nothing on the client, so React never creates a <script> there", () => {
    const { container } = render(<InlineScript id="x" code="window.__x = 1" />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("is a client component (a server component's script is re-created in the browser)", () => {
    const src = readFileSync(join(process.cwd(), "Components/shared/InlineScript.tsx"), "utf8");
    expect(src.trimStart().startsWith('"use client"')).toBe(true);
  });

  it("the root layout does not render <script>/<Script> directly", () => {
    const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8")
      .replace(/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""); // ignore comments
    expect(layout).not.toMatch(/<Script[\s>]/);
    expect(layout).not.toMatch(/<script[\s>]/);
    expect(layout).toContain("InlineScript");
  });
});
