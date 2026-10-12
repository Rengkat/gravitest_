"use client";

import { useState, useCallback, useEffect } from "react";
import type { Broadcast, BroadcastAudience, BroadcastChannel, BroadcastStatus, CreateBroadcastInput } from "./types";
import * as notificationsApi from "@/lib/api/notifications";
import type { BroadcastCampaignDto } from "@/lib/api/notifications";
import { extractErrorMessage } from "@/lib/api/client";

// ── Mapping between the frontend's Broadcast shape and the backend's
// AdminBroadcast entity (src/notifications/entities/admin-broadcast.entity.ts) ──

function toBackendChannels(channel: BroadcastChannel): ("in_app" | "email")[] {
  if (channel === "both") return ["in_app", "email"];
  return [channel];
}

function toFrontendChannel(channels: string[]): BroadcastChannel {
  const hasInApp = channels.includes("in_app");
  const hasEmail = channels.includes("email");
  if (hasInApp && hasEmail) return "both";
  if (hasEmail) return "email";
  return "in_app";
}

function toAudience(input: CreateBroadcastInput["audience"]) {
  return {
    audienceType: input.type,
    tier: input.tier,
    examType: input.examType,
    userIds: input.userIds,
  };
}

function fromBackendAudience(dto: BroadcastCampaignDto): BroadcastAudience {
  return {
    type: dto.audienceType,
    tier: (dto.audienceTier as BroadcastAudience["tier"]) ?? undefined,
    examType: dto.audienceExamType ?? undefined,
    userIds: dto.audienceUserIds ?? undefined,
  };
}

function fromBackend(dto: BroadcastCampaignDto): Broadcast {
  return {
    id: dto.id,
    title: dto.title,
    body: dto.body,
    emailSubject: dto.emailSubject ?? undefined,
    channel: toFrontendChannel(dto.channels),
    audience: fromBackendAudience(dto),
    recipientCount: dto.recipientCount,
    status: dto.status as BroadcastStatus,
    scheduledFor: dto.scheduledFor,
    createdAt: dto.createdAt,
    createdBy: dto.createdBy,
  };
}

export function useBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await notificationsApi.listBroadcastCampaigns({ limit: 50 });
      setBroadcasts(result.data.map(fromBackend));
    } catch (err) {
      setLastError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const sendBroadcast = useCallback(async (input: CreateBroadcastInput) => {
    setLastError(null);

    if (!input.title.trim() || !input.body.trim()) {
      setLastError("Title and message body are required.");
      return { success: false };
    }
    if (input.audience.type === "specific" && !input.audience.userIds?.length) {
      setLastError("Select at least one recipient.");
      return { success: false };
    }

    setIsSending(true);
    try {
      const audience = toAudience(input.audience);
      const created = await notificationsApi.createBroadcastCampaign({
        title: input.title,
        body: input.body,
        emailSubject: input.emailSubject,
        channels: toBackendChannels(input.channel),
        // SYSTEM is the safe default admin-broadcast type — matches the
        // comment on AdminBroadcast.notificationType on the backend.
        notificationType: "system",
        audienceType: audience.audienceType,
        tier: audience.tier,
        examType: audience.examType,
        userIds: audience.userIds,
        scheduledFor: input.scheduledFor,
      });

      setBroadcasts((prev) => [fromBackend(created), ...prev]);
      return { success: true };
    } catch (err) {
      setLastError(extractErrorMessage(err));
      return { success: false };
    } finally {
      setIsSending(false);
    }
  }, []);

  return { broadcasts, isLoading, isSending, lastError, sendBroadcast, reload: loadHistory };
}
