"use client";

import { useState } from "react";
import { Send, Users, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type {
  BroadcastAudienceType,
  BroadcastChannel,
  CreateBroadcastInput,
  SubscriptionTierFilter,
} from "../types";
import { AUDIENCE_OPTIONS, CHANNEL_OPTIONS, TIER_OPTIONS } from "../broadcastconstants";

interface Props {
  isSending: boolean;
  lastError: string | null;
  onSend: (input: CreateBroadcastInput) => Promise<{ success: boolean }>;
}

const radioCardClass = (active: boolean) =>
  `w-full text-left p-4 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2 ${
    active ? "border-green-800 bg-green-50 ring-1 ring-green-800" : "border-gray-200 hover:bg-cream"
  }`;

export function BroadcastComposer({ isSending, lastError, onSend }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [channel, setChannel] = useState<BroadcastChannel>("in_app");
  const [audienceType, setAudienceType] = useState<BroadcastAudienceType>("all");
  const [tier, setTier] = useState<SubscriptionTierFilter>("free");
  const [examType, setExamType] = useState("");
  const [userIdsRaw, setUserIdsRaw] = useState("");
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const needsEmailSubject = channel === "email" || channel === "both";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    const input: CreateBroadcastInput = {
      title,
      body,
      emailSubject: needsEmailSubject ? emailSubject || title : undefined,
      channel,
      audience:
        audienceType === "all"
          ? { type: "all" }
          : audienceType === "segment"
            ? { type: "segment", tier, examType: examType.trim() || undefined }
            : {
                type: "specific",
                userIds: userIdsRaw
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
      scheduledFor: scheduleForLater && scheduledFor ? new Date(scheduledFor).toISOString() : null,
    };

    const result = await onSend(input);
    if (result.success) {
      setSuccessMessage(
        scheduleForLater ? "Broadcast scheduled successfully." : "Broadcast sent successfully.",
      );
      setTitle("");
      setBody("");
      setEmailSubject("");
      setUserIdsRaw("");
      setScheduleForLater(false);
      setScheduledFor("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl"
      noValidate
      aria-label="Compose broadcast notification">
      {/* ─── MESSAGE CONTENT ─── */}
      <div className="mb-6">
        <label
          htmlFor="broadcast-title"
          className="block text-[13px] font-semibold text-green-900 mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="broadcast-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. WAEC Registration Deadline Extended"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-800 text-[14px]"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="broadcast-body"
          className="block text-[13px] font-semibold text-green-900 mb-1.5">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="broadcast-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={5}
          maxLength={2000}
          placeholder="Write the announcement..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-800 text-[14px] resize-y"
        />
        <p className="text-[12px] text-text-muted mt-1">{body.length}/2000 characters</p>
      </div>

      {/* ─── CHANNEL ─── */}
      <fieldset className="mb-6">
        <legend className="text-[13px] font-semibold text-green-900 mb-2">Send via</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CHANNEL_OPTIONS.map((opt) => (
            <label key={opt.value} className={radioCardClass(channel === opt.value)}>
              <input
                type="radio"
                name="channel"
                value={opt.value}
                checked={channel === opt.value}
                onChange={() => setChannel(opt.value)}
                className="sr-only"
              />
              <span className="block text-[14px] font-medium text-green-900">{opt.label}</span>
              <span className="block text-[12px] text-text-muted mt-0.5">{opt.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {needsEmailSubject && (
        <div className="mb-6">
          <label
            htmlFor="broadcast-email-subject"
            className="block text-[13px] font-semibold text-green-900 mb-1.5">
            Email subject line
          </label>
          <input
            id="broadcast-email-subject"
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder={title || "Leave blank to reuse the title"}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-800 text-[14px]"
          />
        </div>
      )}

      {/* ─── AUDIENCE ─── */}
      <fieldset className="mb-6">
        <legend className="text-[13px] font-semibold text-green-900 mb-2">Audience</legend>
        <div className="grid grid-cols-1 gap-3">
          {AUDIENCE_OPTIONS.map((opt) => (
            <label key={opt.value} className={radioCardClass(audienceType === opt.value)}>
              <input
                type="radio"
                name="audienceType"
                value={opt.value}
                checked={audienceType === opt.value}
                onChange={() => setAudienceType(opt.value)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 text-[14px] font-medium text-green-900">
                <Users size={14} /> {opt.label}
              </span>
              <span className="block text-[12px] text-text-muted mt-0.5">{opt.hint}</span>
            </label>
          ))}
        </div>

        {audienceType === "segment" && (
          <div className="mt-3 pl-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="broadcast-tier"
                className="block text-[12px] font-medium text-text-muted mb-1">
                Subscription tier
              </label>
              <select
                id="broadcast-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as SubscriptionTierFilter)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-800 text-[14px]">
                {TIER_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="broadcast-exam-type"
                className="block text-[12px] font-medium text-text-muted mb-1">
                Exam type (optional)
              </label>
              <input
                id="broadcast-exam-type"
                type="text"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                placeholder="e.g. WAEC, JAMB, NECO"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-800 text-[14px]"
              />
            </div>
          </div>
        )}

        {audienceType === "specific" && (
          <div className="mt-3 pl-1">
            <label
              htmlFor="broadcast-user-ids"
              className="block text-[12px] font-medium text-text-muted mb-1">
              User IDs or emails, comma-separated
            </label>
            <textarea
              id="broadcast-user-ids"
              value={userIdsRaw}
              onChange={(e) => setUserIdsRaw(e.target.value)}
              rows={2}
              placeholder="usr_001, usr_002, chioma@example.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-800 text-[14px]"
            />
          </div>
        )}
      </fieldset>

      {/* ─── SCHEDULE ─── */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-[14px] font-medium text-green-900 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={scheduleForLater}
            onChange={(e) => setScheduleForLater(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-800 focus:ring-2 focus:ring-green-800"
          />
          Schedule for later instead of sending now
        </label>

        {scheduleForLater && (
          <div className="mt-3">
            <label
              htmlFor="broadcast-schedule"
              className="block text-[12px] font-medium text-text-muted mb-1">
              Send date and time
            </label>
            <input
              id="broadcast-schedule"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              required={scheduleForLater}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-800 text-[14px]"
            />
          </div>
        )}
      </div>

      {/* ─── STATUS MESSAGES ─── */}
      {lastError && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
          <AlertCircle size={16} /> {lastError}
        </div>
      )}
      {successMessage && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-[13px]">
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {/* ─── SUBMIT ─── */}
      <button
        type="submit"
        disabled={isSending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-800 text-white hover:bg-green-700 transition-all text-[14px] font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2">
        {isSending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Sending...
          </>
        ) : (
          <>
            <Send size={16} /> {scheduleForLater ? "Schedule broadcast" : "Send broadcast"}
          </>
        )}
      </button>
    </form>
  );
}
