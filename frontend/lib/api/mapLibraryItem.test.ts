import { describe, it, expect } from "vitest";
import type { LibraryContentDto } from "@/lib/api/library";
import { mapLibraryContentToLibraryItem } from "./mapLibraryItem";
import { accessLabel, isItemLocked } from "@/lib/constants/helpers";

const dto = (o: Partial<LibraryContentDto> = {}): LibraryContentDto =>
  ({
    id: "c1", title: "T", description: null, contentType: "video", subject: null, topic: null, fileUrl: "",
    thumbnailUrl: null, durationSeconds: null, totalPages: null, fileSizeBytes: null, examTypes: [], classLevels: [],
    isFree: false, requiredTier: null, priceKobo: null, totalViews: 0, totalDownloads: 0, averageRating: 0,
    totalRatings: 0, isActive: true, isPublished: true, isFeatured: false, uploaderId: null, author: null, tags: [],
    isDownloadable: false, drmProtected: false, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", ...o,
  }) as LibraryContentDto;

describe("library item lock state", () => {
  it("a subscriber on content their plan includes is NOT locked (no Unlock/Upgrade prompt)", () => {
    const item = mapLibraryContentToLibraryItem(dto({ requiredTier: "basic", hasAccess: true, accessReason: "subscription", accessModel: "subscription" }));
    expect(item.isPremium).toBe(true); // still premium content (badges/filters)…
    expect(isItemLocked(item)).toBe(false); // …but open for this student
    expect(accessLabel(item)).toBe("Watch");
  });

  it("someone without a plan IS locked on plan content", () => {
    const item = mapLibraryContentToLibraryItem(dto({ requiredTier: "basic", hasAccess: false, accessModel: "subscription" }));
    expect(isItemLocked(item)).toBe(true);
    expect(accessLabel(item)).toBe("Unlock");
  });

  it("an item sold one by one stays locked for a subscriber who hasn't bought it, and opens once bought", () => {
    const sold = mapLibraryContentToLibraryItem(dto({ priceKobo: 20000, hasAccess: false, accessModel: "purchase" }));
    expect(isItemLocked(sold)).toBe(true);
    expect(sold.price).toBe(200);
    const bought = mapLibraryContentToLibraryItem(dto({ priceKobo: 20000, hasAccess: true, accessReason: "owned", accessModel: "purchase" }));
    expect(isItemLocked(bought)).toBe(false);
  });

  it("an older server that sends no hasAccess keeps the old behaviour (non-free = locked)", () => {
    expect(isItemLocked(mapLibraryContentToLibraryItem(dto()))).toBe(true);
    expect(isItemLocked(mapLibraryContentToLibraryItem(dto({ isFree: true })))).toBe(false);
  });
});
