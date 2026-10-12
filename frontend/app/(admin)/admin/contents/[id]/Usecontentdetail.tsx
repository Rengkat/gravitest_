"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { ContentItem, AccessLevel } from "@/types/admin-contents";
import {
  getLibraryContent,
  getPlaybackUrl,
  publishLibraryContent,
  unpublishLibraryContent,
  updateLibraryContent,
  deleteLibraryContent,
} from "@/lib/api/library";
import { mapLibraryContentToContentItem } from "@/lib/api/mapLibraryContent";
import { extractErrorMessage } from "@/lib/api/client";
import { toBackendExamTypes } from "@/lib/api/contentMapping";

// ─── Action types — mapped to backend endpoints ───────────────────────────────
// publish        → PATCH /library/:id/publish
// unpublish      → PATCH /library/:id/unpublish
// feature        → PATCH /library/:id  { isFeatured: true }
// unfeature      → PATCH /library/:id  { isFeatured: false }
// edit           → PATCH /library/:id  { title, description, subject, examTypes,
//                  author, tags, isDownloadable, drmProtected }
//                  `audience` is derived (not stored) from examTarget — see
//                  PROFESSIONAL_EXAMS in mapLibraryContent.ts — so it's not sent.
// change_access  → PATCH /library/:id  { isFree, requiredTier, priceKobo }
// delete         → DELETE /library/:id (soft-delete: isActive = false)

export type AdminAction =
  | "publish"
  | "unpublish"
  | "feature"
  | "unfeature"
  | "edit"
  | "delete"
  | "change_access";

export type DetailTab = "preview" | "analytics" | "access" | "activity";

export interface EditForm {
  title: string;
  description: string;
  author: string;
  subject: string;
  examTarget: string;
  audience: string;
  tags: string;
  isDownloadable: boolean;
  drmProtected: boolean;
}

export interface AccessForm {
  accessLevel: string;
  price: string;
}

interface UseContentDetailReturn {
  item: ContentItem | null;
  loading: boolean;
  actionLoading: boolean;
  activeTab: DetailTab;
  pendingAction: AdminAction | null;
  confirmInput: string;
  editForm: EditForm | null;
  accessForm: AccessForm;

  setActiveTab: (t: DetailTab) => void;
  initiateAction: (a: AdminAction) => void;
  cancelAction: () => void;
  confirmAction: () => Promise<void>;
  setConfirmInput: (v: string) => void;
  setEditForm: (d: EditForm) => void;
  setAccessForm: (d: AccessForm) => void;
}

export function useContentDetail(contentId: string): UseContentDetailReturn {
  const router = useRouter();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("preview");
  const [pendingAction, setPendingAction] = useState<AdminAction | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [accessForm, setAccessForm] = useState<AccessForm>({ accessLevel: "free", price: "" });


  // Merges a freshly-mapped item over the previous one, but keeps the
  // playback URL `load()` resolved via getPlaybackUrl — the mapper only
  // fills fileUrl for free content, so a bare overwrite here would wipe
  // out the resolved URL for paid content after every publish/edit call.
  const mergeItem = useCallback(
    (prev: ContentItem | null, dto: Parameters<typeof mapLibraryContentToContentItem>[0]) => {
      if (!prev) return prev;
      const mapped = mapLibraryContentToContentItem(dto);
      return { ...prev, ...mapped, fileUrl: mapped.fileUrl ?? prev.fileUrl };
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dto = await getLibraryContent(contentId);
      const mapped = mapLibraryContentToContentItem(dto);

      // Raw dto.fileUrl is an R2 object key for gated content, not a
      // playable URL. Admins now always pass checkAccess (see the backend
      // admin bypass in LibraryService.checkAccess), so this resolves to
      // the real signed/CDN URL rather than the empty string the student
      // page would get before purchasing.
      try {
        const play = await getPlaybackUrl(contentId);
        mapped.fileUrl = play.url;
      } catch {
        // Non-fatal — preview tab falls back to "no preview available".
      }

      setItem(mapped);
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    load();
  }, [load]);

  const initiateAction = useCallback(
    (action: AdminAction) => {
      setPendingAction(action);
      setConfirmInput("");
      if (action === "edit" && item) {
        setEditForm({
          title: item.title,
          description: item.description,
          author: item.author,
          subject: item.subject,
          examTarget: item.examTarget,
          audience: item.audience,
          tags: item.tags.join(", "),
          isDownloadable: item.isDownloadable,
          drmProtected: item.drmProtected,
        });
      }
      if (action === "change_access" && item) {
        setAccessForm({
          accessLevel: item.accessLevel,
          price: item.price > 0 ? String(item.price) : "",
        });
      }
    },
    [item],
  );

  const cancelAction = useCallback(() => {
    setPendingAction(null);
    setConfirmInput("");
    setEditForm(null);
  }, []);

  const confirmAction = useCallback(async () => {
    if (!item || !pendingAction) return;

    setActionLoading(true);
    try {
      switch (pendingAction) {
        case "publish": {
          const dto = await publishLibraryContent(item.id);
          setItem((prev) => mergeItem(prev, dto));
          toast.success("Content published");
          break;
        }
        case "unpublish": {
          const dto = await unpublishLibraryContent(item.id);
          setItem((prev) => mergeItem(prev, dto));
          toast.success("Content unpublished");
          break;
        }
        case "feature": {
          const dto = await updateLibraryContent(item.id, { isFeatured: true });
          setItem((prev) => mergeItem(prev, dto));
          toast.success("Content featured");
          break;
        }
        case "unfeature": {
          const dto = await updateLibraryContent(item.id, { isFeatured: false });
          setItem((prev) => mergeItem(prev, dto));
          toast.success("Content unfeatured");
          break;
        }
        case "delete": {
          await deleteLibraryContent(item.id);
          toast.success("Content deleted");
          router.push("/admin/contents");
          return; // navigating away — skip the state updates below
        }
        case "edit": {
          if (!editForm) break;
          // examTarget is a single value on this form but the backend
          // stores an array (examTypes) — same conversion AddContentModal
          // uses at creation time, kept in sync via the shared helper.
          const dto = await updateLibraryContent(item.id, {
            title: editForm.title,
            description: editForm.description,
            subject: editForm.subject || undefined,
            examTypes: toBackendExamTypes(editForm.examTarget) as never,
            author: editForm.author || undefined,
            tags: editForm.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            isDownloadable: editForm.isDownloadable,
            drmProtected: editForm.drmProtected,
          });
          setItem((prev) => mergeItem(prev, dto));
          toast.success("Content updated");
          break;
        }
        case "change_access": {
          const price = parseFloat(accessForm.price) || 0;
          const isFree = accessForm.accessLevel === "free";
          const dto = await updateLibraryContent(item.id, {
            isFree,
            // Same one-access-model-only rule as content creation: a
            // price entered here means "one-time purchase" (priceKobo),
            // which is mutually exclusive with a subscription-tier gate
            // (requiredTier) on the backend — sending both throws
            // "Specify only one of: isFree, requiredTier, or priceKobo".
            requiredTier:
              !isFree && price === 0 ? (accessForm.accessLevel as Exclude<AccessLevel, "free">) : null,
            priceKobo: !isFree && price > 0 ? Math.round(price * 100) : null,
          });
          setItem((prev) => mergeItem(prev, dto));
          toast.success("Access settings updated");
          break;
        }
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setActionLoading(false);
      cancelAction();
    }
  }, [item, pendingAction, editForm, accessForm, cancelAction, router, mergeItem]);

  return {
    item,
    loading,
    actionLoading,
    activeTab,
    pendingAction,
    confirmInput,
    editForm,
    accessForm,
    setActiveTab,
    initiateAction,
    cancelAction,
    confirmAction,
    setConfirmInput,
    setEditForm,
    setAccessForm,
  };
}
