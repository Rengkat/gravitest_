"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import type { PaymentGatewayCode, PaymentGatewayOption } from "@/lib/api/billing";
import { usePaymentGateways } from "@/lib/hooks/useBilling";
import { startContentPurchase } from "@/lib/billing/purchase";
import { defaultGateway } from "@/Components/billing/GatewayPicker";
import type {
  LibraryContent,
  AccessCheckResult,
  LibraryAccess,
  RatingEntry,
  RelatedItem,
} from "./types";
import { adaptToLegacyContent, adaptToRelatedItem, toAccessReason } from "./legacyAdapter";
import {
  getLibraryContent,
  getPlaybackUrl,
  getMyAccessRecord,
  recordLibraryAccess,
  addLibraryBookmark,
  browseLibrary,
  rateLibraryContent,
  listLibraryRatings,
  getMyLibraryRating,
  markRatingHelpful,
  getContentPreview,
  type LibraryRatingDto,
  type ContentPreview,
} from "@/lib/api/library";
import { extractErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";

export type ContentTab = "about" | "ratings" | "related";
interface State {
  content: LibraryContent | null;
  access: AccessCheckResult | null;
  record: LibraryAccess | null;
  /** Server-generated free preview for content the caller doesn't have access to — null until fetched/not applicable. See Player.tsx. */
  preview: ContentPreview | null;
  ratings: RatingEntry[];
  related: RelatedItem[];
  loading: boolean;
  activeTab: ContentTab;
  userRating: number;
  hoverRating: number;
  reviewText: string;
  submittingRating: boolean;
  ratingDone: boolean;
  progressPct: number;
  purchasing: boolean;
  /** Payment methods the admin offers for one-time purchases. */
  gateways: PaymentGatewayOption[];
  /** The method that will be used: the buyer's pick, else the admin's default. */
  purchaseGateway: PaymentGatewayCode | null;
}

interface Actions {
  setTab: (t: ContentTab) => void;
  setUserRating: (n: number) => void;
  setHoverRating: (n: number) => void;
  setReviewText: (s: string) => void;
  submitRating: () => Promise<void>;
  markHelpful: (ratingId: string) => Promise<void>;
  updateProgress: (pct: number) => void;
  addBookmark: (position: number, note?: string) => Promise<void>;
  handlePurchase: () => Promise<void>;
  setPurchaseGateway: (g: PaymentGatewayCode) => void;
  /** Ask the server for a fresh playback URL (expired link, failed load). */
  reloadPlayback: () => Promise<void>;
}

function mapRating(dto: LibraryRatingDto, myUserId?: string): RatingEntry {
  const parts = dto.userDisplayName.trim().split(/\s+/);
  const initials =
    parts
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  return {
    id: dto.id,
    userId: dto.userId,
    userName: dto.userId === myUserId ? "You" : dto.userDisplayName,
    initials,
    rating: dto.rating,
    review: dto.review ?? undefined,
    createdAt: dto.createdAt,
    helpful: dto.helpfulCount,
  };
}

export function useContentDetail(id: string): State & Actions {
  const [content, setContent] = useState<LibraryContent | null>(null);
  const [access, setAccess] = useState<AccessCheckResult | null>(null);
  const [record, setRecord] = useState<LibraryAccess | null>(null);
  const [preview, setPreview] = useState<ContentPreview | null>(null);
  // Ratings are fully wired to the real API — list + "my rating" fetched
  // below, submit/markHelpful call the real endpoints too. The backend
  // enforces "must have access (free/purchased/subscription) before
  // rating" via LibraryService.rateContent()'s checkAccess() call, and
  // RatingsTab only shows the submission form when hasAccess is true.
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab] = useState<ContentTab>("about");
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [contentType, setContentType] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  // Payment methods the admin offers, and the one the buyer picked. null =
  // "not chosen yet" -> the admin's default (derived, so it stays valid if the
  // list of enabled gateways changes under the user).
  const { data: gatewayList } = usePaymentGateways();
  const gateways: PaymentGatewayOption[] = gatewayList ?? [];
  const [pickedGateway, setPickedGateway] = useState<PaymentGatewayCode | null>(null);
  const purchaseGateway: PaymentGatewayCode | null =
    pickedGateway && gateways.some((g) => g.code === pickedGateway) ? pickedGateway : defaultGateway(gateways);

  useEffect(() => {
    let cancelled = false;
    // Cleared by the effect's cleanup (id changes, or unmount) so a poll
    // for a content item the user has navigated away from never lands.
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    // Preview generation runs in the background on the server (a few
    // seconds for video, near-instant for a PDF excerpt). "pending" means
    // keep asking; anything else (ready/failed/not_applicable) is final.
    // Backs off 3s → 5s → 8s → 8s… and gives up after ~2 minutes so a
    // permanently-stuck job doesn't poll forever in an open tab.
    const pollPreview = (delayMs: number, attempt: number) => {
      if (cancelled || attempt > 20) return;
      pollTimer = setTimeout(async () => {
        if (cancelled) return;
        try {
          const p = await getContentPreview(id);
          if (cancelled) return;
          setPreview(p);
          if (p.status === "pending") {
            pollPreview(Math.min(delayMs * 1.5, 8000), attempt + 1);
          }
        } catch {
          // Transient — the current "pending" state just stays on screen;
          // no retry-storm on a flaky connection.
        }
      }, delayMs);
    };

    const load = async () => {
      setLoading(true);
      try {
        // findOneForUser on the backend merges access-check into the
        // content payload (hasAccess/accessReason) in one call.
        const dto = await getLibraryContent(id);
        if (cancelled) return;

        setContentType(dto.contentType);
        setAccess({ hasAccess: dto.hasAccess ?? false, reason: toAccessReason(dto.accessReason) });

        let resolvedFileUrl: string | null = null;
        if (!dto.hasAccess) {
          // Fire immediately (attempt 0 delay) — first response is usually
          // "pending", which schedules the actual backoff polling above.
          getContentPreview(id)
            .then((p) => {
              if (cancelled) return;
              setPreview(p);
              if (p.status === "pending") pollPreview(3000, 1);
            })
            .catch(() => {});
        }

        if (dto.hasAccess) {
          try {
            const play = await getPlaybackUrl(id);
            resolvedFileUrl = play.url;
          } catch {
            // Access confirmed but URL resolution failed (e.g. R2 not
            // provisioned yet in this environment) — page still renders,
            // just without a working player src.
          }

          try {
            const rec = await getMyAccessRecord(id);
            if (!cancelled && rec) {
              const normalized: LibraryAccess = {
                id: rec.id ?? `${id}-access`,
                userId: rec.userId ?? "",
                contentId: id,
                contentType:
                  (dto.contentType.toUpperCase() as LibraryAccess["contentType"]) ?? "DOCUMENT",
                expiresAt: rec.expiresAt ?? null,
                viewCount: rec.viewCount ?? 0,
                downloadCount: rec.downloadCount ?? 0,
                progressPercent: rec.progressPercent ?? 0,
                lastAccessedAt: rec.lastAccessedAt ?? null,
                bookmarks: rec.bookmarks ?? [],
                highlights: rec.highlights ?? null,
                paymentId: rec.paymentId ?? null,
                createdAt: rec.createdAt ?? new Date().toISOString(),
              };
              setRecord(normalized);
              setProgressPct(normalized.progressPercent);
            }
          } catch {
            // No access record yet (first time opening this content).
          }
        }

        if (!cancelled) setContent(adaptToLegacyContent(dto, resolvedFileUrl));

        if (dto.subject || dto.examTypes?.length) {
          browseLibrary({
            subject: dto.subject ?? undefined,
            examType: dto.examTypes?.[0],
            limit: 6,
          })
            .then((res) => {
              if (!cancelled) {
                setRelated(res.data.filter((r) => r.id !== id).map(adaptToRelatedItem));
              }
            })
            .catch(() => {});
        }

        const myUserId = useAuthStore.getState().user?.id;
        listLibraryRatings(id, 1, 20)
          .then((res) => {
            if (!cancelled) setRatings(res.data.map((r) => mapRating(r, myUserId)));
          })
          .catch(() => {});

        getMyLibraryRating(id)
          .then((mine) => {
            if (!cancelled && mine) {
              setUserRating(mine.rating);
              setReviewText(mine.review ?? "");
            }
          })
          .catch(() => {
            // No rating from this user yet — fine, form starts blank.
          });
      } catch (err) {
        if (!cancelled) toast.error(extractErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [id]);

  const updateProgress = useCallback(
    (pct: number) => {
      setProgressPct(pct);
      if (!contentType) return;
      recordLibraryAccess({
        contentId: id,
        contentType: contentType as never,
        progressPercent: pct,
      }).catch(() => {
        // Best-effort — progress will sync again on the next update.
      });
    },
    [id, contentType],
  );

  const addBookmark = useCallback(
    async (position: number, note?: string) => {
      try {
        await addLibraryBookmark(id, position, note);
        setRecord((prev) =>
          prev
            ? {
                ...prev,
                bookmarks: [
                  ...(prev.bookmarks ?? []),
                  { position, note, createdAt: new Date().toISOString() },
                ],
              }
            : prev,
        );
        toast.success("Bookmark added");
      } catch (err) {
        toast.error(extractErrorMessage(err));
      }
    },
    [id],
  );

  const handlePurchase = useCallback(async () => {
    setPurchasing(true);
    try {
      // No gateway sent when the list couldn't be loaded -> the server uses its default.
      // Full-page redirect to the gateway's hosted checkout — same pattern
      // as subscription checkout (see useBilling.ts's subscribe()).
      await startContentPurchase(id, purchaseGateway ?? undefined);
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setPurchasing(false);
    }
  }, [id, purchaseGateway]);

  const reloadPlayback = useCallback(async () => {
    try {
      const play = await getPlaybackUrl(id);
      setContent((prev) => (prev ? { ...prev, fileUrl: play.url } : prev));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }, [id]);

  const submitRating = useCallback(async () => {
    if (!userRating) return;
    setSubmittingRating(true);
    try {
      const saved = await rateLibraryContent(id, {
        rating: userRating,
        review: reviewText || undefined,
      });
      const myUserId = useAuthStore.getState().user?.id;
      setRatings((prev) => {
        const withoutMine = prev.filter((r) => r.userId !== saved.userId);
        return [mapRating(saved, myUserId), ...withoutMine];
      });
      setRatingDone(true);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmittingRating(false);
    }
  }, [id, userRating, reviewText]);

  const markHelpful = useCallback(async (ratingId: string) => {
    try {
      const updated = await markRatingHelpful(ratingId);
      setRatings((prev) =>
        prev.map((r) => (r.id === ratingId ? { ...r, helpful: updated.helpfulCount } : r)),
      );
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }, []);

  return {
    content,
    access,
    record,
    preview,
    ratings,
    related,
    loading,
    activeTab,
    userRating,
    hoverRating,
    reviewText,
    submittingRating,
    ratingDone,
    progressPct,
    setTab,
    setUserRating,
    setHoverRating,
    setReviewText,
    submitRating,
    markHelpful,
    updateProgress,
    addBookmark,
    handlePurchase,
    setPurchaseGateway: setPickedGateway,
    gateways,
    purchaseGateway,
    reloadPlayback,
    purchasing,
  };
}
