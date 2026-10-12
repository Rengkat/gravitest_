import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Player } from "../Player";
import type { LibraryContent, AccessCheckResult } from "../../types";
import type { ContentPreview } from "@/lib/api/library";

// Regression tests for the student-side "preview" crash:
//   • "An empty string ("") was passed to the src attribute"
//   • "unhandledRejection: AbortError: The play() request was interrupted by a call to pause()"
// Plus coverage for the real server-generated preview clip (replacing the
// old client-side "stop playback at N seconds against the full file" logic).

const base = {
  id: "c1",
  title: "Intro to Algebra",
  description: null,
  contentType: "VIDEO",
  subject: null,
  topic: null,
  fileUrl: "",
  thumbnailUrl: null,
  durationSeconds: 300,
  totalPages: null,
  fileSizeBytes: null,
  examTypes: [],
  classLevels: [],
  isFree: false,
  requiredTier: null,
  priceKobo: 50000,
  totalViews: 0,
  totalDownloads: 0,
  averageRating: 0,
  isActive: true,
  isPublished: true,
  createdAt: "",
  updatedAt: "",
} as unknown as LibraryContent;

const noAccess: AccessCheckResult = { hasAccess: false, reason: "no_access" };
const hasAccess: AccessCheckResult = { hasAccess: true, reason: "owned" };

const props = {
  record: null,
  onProgress: vi.fn(),
  onBookmark: vi.fn(),
  onPurchase: vi.fn(),
  purchasing: false,
};

const readyVideoPreview: ContentPreview = {
  status: "ready",
  url: "https://cdn.test/preview-clip.mp4",
  expiresInSeconds: 3600,
  durationSeconds: 45,
  pages: null,
};
const readyDocPreview: ContentPreview = {
  status: "ready",
  url: "https://cdn.test/preview-excerpt.pdf",
  expiresInSeconds: 3600,
  durationSeconds: null,
  pages: 2,
};

afterEach(() => vi.restoreAllMocks());

describe("Player with no file URL (owner)", () => {
  it("offers a retry (not a paywall) when the user HAS access but the URL failed to resolve", () => {
    const onRetry = vi.fn();
    const { container } = render(
      <Player {...props} content={base} access={hasAccess} onRetry={onRetry} />,
    );
    expect(container.querySelector("video")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("Player without access — real server-generated preview", () => {
  it.each(["VIDEO", "AUDIO", "DOCUMENT"] as const)(
    "%s: shows a loading state (not the hard paywall) while the preview is still generating",
    (contentType) => {
      // preview omitted entirely == "haven't heard back from the server yet",
      // same as the pending status — must not jump straight to the paywall.
      const { container } = render(
        <Player {...props} content={{ ...base, contentType }} access={noAccess} />,
      );
      expect(container.querySelector("video, audio, iframe")).toBeNull();
      expect(screen.getByText("Preparing your free preview")).toBeInTheDocument();
      expect(screen.queryByText("Premium content")).toBeNull();
    },
  );

  it.each(["VIDEO", "AUDIO", "DOCUMENT"] as const)(
    "%s: shows the locked paywall once the server says there's nothing to preview",
    (contentType) => {
      const notApplicable: ContentPreview = { status: "not_applicable" };
      const { container } = render(
        <Player
          {...props}
          content={{ ...base, contentType }}
          access={noAccess}
          preview={notApplicable}
        />,
      );
      expect(container.querySelector("video, audio, iframe")).toBeNull();
      expect(screen.getByText("Premium content")).toBeInTheDocument();
    },
  );

  it("VIDEO: plays the short clip URL, never the (empty) full fileUrl", () => {
    const { container } = render(
      <Player {...props} content={base} access={noAccess} preview={readyVideoPreview} />,
    );
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", readyVideoPreview.url);
  });

  it("AUDIO: plays the short clip URL, never the (empty) full fileUrl", () => {
    const { container } = render(
      <Player
        {...props}
        content={{ ...base, contentType: "AUDIO" }}
        access={noAccess}
        preview={readyVideoPreview}
      />,
    );
    const audio = container.querySelector("audio");
    expect(audio).not.toBeNull();
    expect(audio).toHaveAttribute("src", readyVideoPreview.url);
  });

  it("DOCUMENT: renders the excerpt PDF and stops navigation at the excerpt's own page count", () => {
    const { container } = render(
      <Player
        {...props}
        content={{ ...base, contentType: "DOCUMENT", totalPages: 40 }}
        access={noAccess}
        preview={readyDocPreview}
      />,
    );
    const iframe = container.querySelector("iframe")!;
    expect(iframe.getAttribute("src")).toContain(readyDocPreview.url);
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    // On the second-to-last page of the excerpt, a "more pages" hint previews
    // what unlocking gets you — using the real total (40), not the excerpt (2).
    expect(screen.getByText(/38 more pages/)).toBeInTheDocument();

    // Next lands on the excerpt's OWN last page (2) — the file has nothing
    // beyond that to navigate to — and shows the paywall instead of content.
    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument();
    expect(screen.getByText("Preview ended")).toBeInTheDocument();
    expect(screen.getByText(/2 pages free preview/)).toBeInTheDocument();
    // Next is disabled there: nothing past page 2 exists in this file.
    expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
  });

  it("VIDEO: reaching the end of the (short) clip shows the paywall — no mid-clip cutoff needed", () => {
    const { container } = render(
      <Player {...props} content={base} access={noAccess} preview={readyVideoPreview} />,
    );
    const video = container.querySelector("video")!;
    fireEvent.ended(video);
    expect(screen.getByText("Preview ended")).toBeInTheDocument();
    // The accurate, server-verified clip length is used, not the requested default.
    expect(screen.getByText(/45s free preview/)).toBeInTheDocument();
  });

  it("does not call onProgress (access-tracking) while playing a free preview clip", () => {
    const onProgress = vi.fn();
    const { container } = render(
      <Player {...props} onProgress={onProgress} content={base} access={noAccess} preview={readyVideoPreview} />,
    );
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "duration", { value: 45, configurable: true });
    Object.defineProperty(video, "currentTime", { value: 10, configurable: true });
    fireEvent.timeUpdate(video);
    expect(onProgress).not.toHaveBeenCalled();
  });
});

describe("play()/pause() race", () => {
  it("swallows AbortError from play() instead of raising an unhandled rejection", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);

    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValue(new DOMException("interrupted by pause()", "AbortError"));

    const { container } = render(
      <Player {...props} content={{ ...base, fileUrl: "https://cdn.test/v.mp4" }} access={hasAccess} />,
    );
    expect(container.querySelector("video")).not.toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Play" })[0]);
    await waitFor(() => expect(play).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));

    expect(unhandled).not.toHaveBeenCalled();
    // and the UI must not claim it is playing
    expect(screen.getAllByRole("button", { name: "Play" }).length).toBeGreaterThan(0);
    process.off("unhandledRejection", unhandled);
  });

  it("follows the element's real play/pause events for the button state", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const { container } = render(
      <Player {...props} content={{ ...base, fileUrl: "https://cdn.test/v.mp4" }} access={hasAccess} />,
    );
    const video = container.querySelector("video")!;
    fireEvent.play(video);
    await waitFor(() => expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument());
    fireEvent.pause(video);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Pause" })).toBeNull());
  });
});
