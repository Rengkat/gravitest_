import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  getPlatformAppearance: vi.fn(),
  updatePlatformAppearance: vi.fn(),
}));
vi.mock("@/lib/api/platform", () => api);

import PlatformAccentCard from "../PlatformAccentCard";

const accentTag = () => document.getElementById("gt-accent")?.textContent ?? "";

beforeEach(() => {
  document.head.innerHTML = "";
  api.getPlatformAppearance.mockResolvedValue({ accentColor: "#2E8B57", updatedAt: "" });
  api.updatePlatformAppearance.mockImplementation(async (hex: string) => ({ accentColor: hex, updatedAt: "" }));
});

describe("PlatformAccentCard", () => {
  it("previews a preset live, saves it for everyone, and reflects the saved value", async () => {
    render(<PlatformAccentCard />);
    const blue = await screen.findByRole("radio", { name: "Blue" });
    const apply = screen.getByRole("button", { name: /apply to everyone/i });
    expect(apply).toBeDisabled();

    fireEvent.click(blue);
    expect(blue).toHaveAttribute("aria-checked", "true");
    expect(accentTag()).toContain("--accent-800"); // live preview applied before saving
    expect(apply).toBeEnabled();

    fireEvent.click(apply);
    await waitFor(() => expect(api.updatePlatformAppearance).toHaveBeenCalledWith("#2563EB"));
    await waitFor(() => expect(screen.getByRole("button", { name: /apply to everyone/i })).toBeDisabled());
  });

  it("does not apply an invalid hex and flags it", async () => {
    render(<PlatformAccentCard />);
    const input = await screen.findByLabelText("Custom colour");
    fireEvent.change(input, { target: { value: "#12" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: /apply to everyone/i })).toBeDisabled();
  });

  it("reverts an unsaved preview when the admin leaves the page", async () => {
    const { unmount } = render(<PlatformAccentCard />);
    fireEvent.click(await screen.findByRole("radio", { name: "Red" }));
    const previewing = accentTag();
    unmount();
    expect(accentTag()).not.toBe(previewing);
    expect(accentTag()).toContain("--accent-800:#1a4a2e"); // back to the saved default palette
  });

  it("keeps the preview and shows an error when saving fails", async () => {
    api.updatePlatformAppearance.mockRejectedValue(new Error("boom"));
    render(<PlatformAccentCard />);
    fireEvent.click(await screen.findByRole("radio", { name: "Purple" }));
    fireEvent.click(screen.getByRole("button", { name: /apply to everyone/i }));
    expect(await screen.findByText(/couldn't save/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply to everyone/i })).toBeEnabled();
  });
});
