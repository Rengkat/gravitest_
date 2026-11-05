import { describe, expect, it } from "vitest";
import { resolveVideoSource } from "../video";

describe("resolveVideoSource", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"],
    ["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"],
    ["https://vimeo.com/123456789", "https://player.vimeo.com/video/123456789"],
  ])("embeds %s through a fixed, trusted URL", (input, expected) => {
    expect(resolveVideoSource(input)).toEqual({ kind: "iframe", src: expected });
  });

  it("plays direct files with <video>", () => {
    expect(resolveVideoSource("https://cdn.example.com/a/b.mp4")).toEqual({ kind: "file", src: "https://cdn.example.com/a/b.mp4" });
  });

  it("never iframes unknown hosts — they open in a new tab instead", () => {
    expect(resolveVideoSource("https://evil.example.com/watch?v=dQw4w9WgXcQ").kind).toBe("link");
  });

  it("refuses non-http schemes and garbage", () => {
    expect(resolveVideoSource("javascript:alert(1)").kind).toBe("link");
    expect(resolveVideoSource("not a url").kind).toBe("link");
  });

  it("rejects malformed YouTube ids instead of passing them through", () => {
    expect(resolveVideoSource("https://www.youtube.com/watch?v=../../x").kind).toBe("link");
  });
});
