"use client";

import { X, AlertTriangle, Info } from "lucide-react";
import type { ContentItem } from "@/types/admin-contents";
import {
  CONTENT_TYPES,
  SUBJECTS,
  ACCESS_LEVELS,
  SECONDARY_EXAMS,
  PROFESSIONAL_EXAMS,
} from "@/lib/constants/contents";
import type { AdminAction, EditForm, AccessForm } from "../Usecontentdetail";
import { RichTextEditor } from "@/Components/rich-text/RichTextEditor";

// ─── Shared ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all text-green-900";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-semibold text-green-900 mb-1.5">{children}</label>
  );
}

function AlertBox({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "warning" | "danger";
}) {
  const s = {
    info: { cls: "bg-blue-50 border-blue-100 text-blue-800", Icon: Info },
    warning: { cls: "bg-amber-50 border-amber-100 text-amber-800", Icon: AlertTriangle },
    danger: { cls: "bg-red-50 border-red-100 text-red-700", Icon: AlertTriangle },
  }[variant];
  return (
    <div className={`rounded-xl border p-4 flex gap-3 text-[13px] leading-relaxed ${s.cls}`}>
      <s.Icon size={16} className="shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  loading,
  children,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  danger = false,
}: {
  title: string;
  onClose: () => void;
  loading: boolean;
  children: React.ReactNode;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 id="modal-title" className="font-serif text-xl text-green-900">
            {title}
          </h3>
          <button
            title="close"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-text-muted hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button
            title="confirm"
            onClick={onConfirm}
            disabled={confirmDisabled || loading}
            //TODO: add aria-busy when loading is true, but it doesn't seem to update on click. Need to investigate if this is a React issue or something else
            // aria-busy={loading}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all text-[14px] disabled:opacity-50 ${danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-800 text-white hover:bg-green-700"}`}>
            {loading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

interface ActionModalProps {
  actionType: AdminAction;
  item: ContentItem;
  confirmInput: string;
  editForm: EditForm | null;
  accessForm: AccessForm;
  loading: boolean;
  onConfirmInputChange: (v: string) => void;
  onEditFormChange: (d: EditForm) => void;
  onAccessFormChange: (d: AccessForm) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionModal({
  actionType,
  item,
  confirmInput,
  editForm,
  accessForm,
  loading,
  onConfirmInputChange,
  onEditFormChange,
  onAccessFormChange,
  onConfirm,
  onCancel,
}: ActionModalProps) {
  // ── Publish ────────────────────────────────────────────────────────────────
  if (actionType === "publish") {
    return (
      <Modal
        title="Publish Content"
        onClose={onCancel}
        loading={loading}
        onConfirm={onConfirm}
        confirmLabel="Publish"
        confirmDisabled={false}>
        <AlertBox variant="info">
          <strong>{item.title}</strong> will become visible to all eligible students on the Gravitas
          Library. Make sure the file and metadata are correct before publishing.
        </AlertBox>
      </Modal>
    );
  }

  // ── Unpublish ──────────────────────────────────────────────────────────────
  if (actionType === "unpublish") {
    return (
      <Modal
        title="Unpublish Content"
        onClose={onCancel}
        loading={loading}
        onConfirm={onConfirm}
        confirmLabel="Unpublish"
        confirmDisabled={false}
        danger>
        <AlertBox variant="warning">
          <strong>{item.title}</strong> will be hidden from students immediately. The file is
          preserved and can be republished at any time. Existing access records are not affected.
        </AlertBox>
      </Modal>
    );
  }

  // ── Feature / unfeature ────────────────────────────────────────────────────
  if (actionType === "feature" || actionType === "unfeature") {
    const featuring = actionType === "feature";
    return (
      <Modal
        title={featuring ? "Mark as Featured" : "Remove from Featured"}
        onClose={onCancel}
        loading={loading}
        onConfirm={onConfirm}
        confirmLabel={featuring ? "Feature" : "Remove"}
        confirmDisabled={false}>
        <AlertBox variant="info">
          {featuring
            ? `"${item.title}" will be pinned to the top of the Gravitas Library homepage and highlighted in search results.`
            : `"${item.title}" will be removed from the featured section. It remains published and accessible.`}
        </AlertBox>
      </Modal>
    );
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  if (actionType === "delete") {
    return (
      <Modal
        title="Delete Content"
        onClose={onCancel}
        loading={loading}
        onConfirm={onConfirm}
        confirmLabel="Delete"
        confirmDisabled={confirmInput !== item.title}
        danger>
        <AlertBox variant="danger">
          This will soft-delete <strong>{item.title}</strong>. The content will be deactivated and
          hidden from all students. Access records are preserved but the file will no longer be
          served.
        </AlertBox>
        <div>
          <Label>Type the content title to confirm</Label>
          <input
            type="text"
            className={inputCls}
            value={confirmInput}
            onChange={(e) => onConfirmInputChange(e.target.value)}
            placeholder={item.title}
            autoComplete="off"
            aria-describedby="delete-hint"
          />
          <p id="delete-hint" className="text-[11px] text-text-muted mt-1 font-mono">
            {item.title}
          </p>
        </div>
      </Modal>
    );
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  if (actionType === "edit" && editForm) {
    const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) =>
      onEditFormChange({ ...editForm, [k]: v });

    const secondaryExams = Object.entries(SECONDARY_EXAMS);
    const professionalExams = Object.entries(PROFESSIONAL_EXAMS);
    const currentExams = editForm.audience === "secondary" ? secondaryExams : professionalExams;

    const allSubjects = Object.entries(SUBJECTS);

    return (
      <Modal
        title="Edit Content Details"
        onClose={onCancel}
        loading={loading}
        onConfirm={onConfirm}
        confirmLabel="Save Changes"
        confirmDisabled={!editForm.title.trim()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Title *</Label>
            <input
              title="title"
              type="text"
              className={inputCls}
              value={editForm.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <RichTextEditor
              initialHTML={editForm.description}
              onChangeHTML={(html) => set("description", html)}
              minHeight={100}
            />
          </div>
          <div>
            <Label>Author</Label>
            <input
              title="author"
              type="text"
              className={inputCls}
              value={editForm.author}
              onChange={(e) => set("author", e.target.value)}
            />
          </div>
          <div>
            <Label>Subject</Label>
            <select
              title="subject"
              className={inputCls}
              value={editForm.subject}
              onChange={(e) => set("subject", e.target.value)}>
              {allSubjects.map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Audience</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["secondary", "professional"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => set("audience", a)}
                  className={`py-2.5 rounded-xl border-2 text-[12px] font-semibold capitalize transition-all ${editForm.audience === a ? "border-green-800 bg-green-50 text-green-900" : "border-gray-200 text-text-muted"}`}>
                  {a === "secondary" ? "Secondary" : "Professional"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Exam Target</Label>
            <select
              title="exam"
              className={inputCls}
              value={editForm.examTarget}
              onChange={(e) => set("examTarget", e.target.value)}>
              {currentExams.map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Tags (comma-separated)</Label>
            <input
              type="text"
              className={inputCls}
              value={editForm.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="e.g., mathematics, waec, 2024"
            />
          </div>
          {/* Toggles */}
          <div className="md:col-span-2 flex flex-wrap gap-5 pt-1">
            {[
              { key: "isDownloadable" as const, label: "Downloadable" },
              { key: "drmProtected" as const, label: "DRM Protected" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  title={editForm[key] ? "Yes" : "No"}
                  className={`w-9 h-5 rounded-full transition-colors relative ${editForm[key] ? "bg-green-800" : "bg-gray-200"}`}
                  onClick={() => set(key, !editForm[key])}
                  // role="switch"
                  //TODO: aria-checked doesn't update on click. Need to investigate if this is a React issue or something else
                  // aria-checked={editForm[key]}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === " " && set(key, !editForm[key])}>
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editForm[key] ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </div>
                <span className="text-[12px] font-medium text-green-900">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  // ── Change Access ──────────────────────────────────────────────────────────
  if (actionType === "change_access") {
    return (
      <Modal
        title="Change Access / Price"
        onClose={onCancel}
        loading={loading}
        onConfirm={onConfirm}
        confirmLabel="Apply Changes"
        confirmDisabled={false}>
        <div className="space-y-4">
          <div>
            <Label>Access Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ACCESS_LEVELS).map(([k, v]) => {
                const Icon = v.icon;
                const selected = accessForm.accessLevel === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onAccessFormChange({ ...accessForm, accessLevel: k })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-[11px] font-semibold transition-all ${selected ? "border-green-800 bg-green-50" : "border-gray-200 text-text-muted"}`}>
                    <Icon size={16} style={{ color: selected ? v.color : "#6b7280" }} />
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
          {accessForm.accessLevel !== "free" && (
            <div>
              <Label>Price (₦) — leave blank for subscription-only</Label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={accessForm.price}
                onChange={(e) => onAccessFormChange({ ...accessForm, price: e.target.value })}
                placeholder="e.g., 5000"
              />
            </div>
          )}
          {accessForm.accessLevel === "free" && (
            <AlertBox variant="info">
              Setting to Free removes the purchase requirement. Existing paid access records are
              unaffected.
            </AlertBox>
          )}
        </div>
      </Modal>
    );
  }

  return null;
}
