"use client";

import { useState, useCallback, useEffect } from "react";
import type { AdminUser } from "../types";
import type { AdminActionType, EditUserFormData } from "./types";
import * as adminApi from "@/lib/api/admin-dashboard";
import { extractErrorMessage } from "@/lib/api/client";

export type DetailTab = "overview" | "activity" | "payments";

export interface ResetPasswordFormData {
  newPassword: string;
  notifyUser: boolean;
}

const STUDENT_ROLES = new Set(["student", "professional_student"]);

interface UseUserDetailReturn {
  user: AdminUser | null;
  studentOverview: adminApi.StudentOverview | null;
  sessions: adminApi.StudentSessionSummary[];
  transactions: adminApi.AdminTransaction[];
  /** Plan, access per service, purchases and payments — null until loaded or if it failed. */
  billing: adminApi.UserBilling | null;
  billingFailed: boolean;
  loading: boolean;
  loadError: string | null;
  actionLoading: boolean;
  actionError: string | null;
  activeTab: DetailTab;
  pendingAction: AdminActionType | null;
  reasonInput: string;
  editForm: EditUserFormData | null;
  resetForm: ResetPasswordFormData;
  lastGeneratedPassword: string | null;
  setActiveTab: (t: DetailTab) => void;
  initiateAction: (a: AdminActionType) => void;
  cancelAction: () => void;
  confirmAction: () => Promise<void>;
  setReasonInput: (v: string) => void;
  setEditForm: (d: EditUserFormData) => void;
  setResetForm: (d: ResetPasswordFormData) => void;
}

export function useUserDetail(userId: string): UseUserDetailReturn {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [studentOverview, setStudentOverview] = useState<adminApi.StudentOverview | null>(null);
  const [sessions, setSessions] = useState<adminApi.StudentSessionSummary[]>([]);
  const [transactions, setTransactions] = useState<adminApi.AdminTransaction[]>([]);
  const [billing, setBilling] = useState<adminApi.UserBilling | null>(null);
  const [billingFailed, setBillingFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [pendingAction, setPendingAction] = useState<AdminActionType | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [editForm, setEditForm] = useState<EditUserFormData | null>(null);
  const [resetForm, setResetForm] = useState<ResetPasswordFormData>({ newPassword: "", notifyUser: true });
  const [lastGeneratedPassword, setLastGeneratedPassword] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const u = (await adminApi.getUser(userId)) as unknown as AdminUser;
        if (cancelled) return;
        setUser(u);

        // Student-specific data — best-effort; a non-student (admin
        // viewing another admin) simply has none of this, which is
        // expected, not an error.
        if (STUDENT_ROLES.has(u.role)) {
          const profileId = await adminApi.findStudentProfileIdByEmail(u.email).catch(() => null);
          if (profileId && !cancelled) {
            const [overview, sessionsRes] = await Promise.allSettled([
              adminApi.getStudentOverviewById(profileId),
              adminApi.getStudentSessionsById(profileId, { limit: 10 }),
            ]);
            if (!cancelled) {
              if (overview.status === "fulfilled") setStudentOverview(overview.value);
              if (sessionsRes.status === "fulfilled") setSessions(sessionsRes.value.data);
            }
          }
        }

        // Plan + access per service + purchases + payments, from one endpoint.
        // If it fails we say so (instead of "no payments") and fall back to
        // the plain payment list so the tab is never silently empty.
        const [bill, txns] = await Promise.allSettled([
          adminApi.getUserBilling(userId),
          adminApi.listTransactions({ search: userId, limit: 20, sortBy: "createdAt", sortOrder: "DESC" }),
        ]);
        if (!cancelled) {
          if (bill.status === "fulfilled") {
            setBilling(bill.value);
            setBillingFailed(false);
            setTransactions(bill.value.transactions);
          } else {
            setBilling(null);
            setBillingFailed(true);
            if (txns.status === "fulfilled") setTransactions(txns.value.data);
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const initiateAction = useCallback(
    (action: AdminActionType) => {
      setPendingAction(action);
      setReasonInput("");
      setActionError(null);
      setLastGeneratedPassword(null);

      if (action === "edit" && user) {
        setEditForm({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber ?? "",
          stateOfResidence: user.stateOfResidence ?? "",
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        });
      }

      if (action === "reset_password") {
        setResetForm({ newPassword: "", notifyUser: true });
      }
    },
    [user],
  );

  const cancelAction = useCallback(() => {
    setPendingAction(null);
    setReasonInput("");
    setEditForm(null);
    setActionError(null);
  }, []);

  const confirmAction = useCallback(async () => {
    if (!user || !pendingAction) return;
    setActionLoading(true);
    setActionError(null);

    try {
      switch (pendingAction) {
        case "deactivate": {
          await adminApi.deactivateUser(user.id, { reason: reasonInput || undefined });
          setUser({ ...user, isActive: false });
          break;
        }
        case "reactivate": {
          const updated = (await adminApi.reactivateUser(user.id)) as unknown as AdminUser;
          setUser(updated);
          break;
        }
        case "edit": {
          if (!editForm) break;
          const updated = (await adminApi.updateUser(user.id, {
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            email: editForm.email,
            phoneNumber: editForm.phoneNumber || undefined,
            role: editForm.role,
            isEmailVerified: editForm.isEmailVerified,
            isPhoneVerified: editForm.isPhoneVerified,
            stateOfResidence: editForm.stateOfResidence || undefined,
          })) as unknown as AdminUser;
          setUser(updated);
          break;
        }
        case "reset_password": {
          const res = await adminApi.resetUserPassword(user.id, {
            newPassword: resetForm.newPassword || undefined,
            notifyUser: resetForm.notifyUser,
          });
          if (res.temporaryPassword) setLastGeneratedPassword(res.temporaryPassword);
          break;
        }
        case "verify_email": {
          const updated = (await adminApi.updateUser(user.id, {
            isEmailVerified: true,
          })) as unknown as AdminUser;
          setUser(updated);
          break;
        }
      }

      // Reset-password shows the one-time generated password inline in
      // the same modal instead of closing immediately — every other
      // action closes right away.
      if (pendingAction !== "reset_password") {
        setPendingAction(null);
      }
      setReasonInput("");
      setEditForm(null);
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }, [user, pendingAction, editForm, resetForm, reasonInput]);

  return {
    user,
    studentOverview,
    sessions,
    transactions,
    billing,
    billingFailed,
    loading,
    loadError,
    actionLoading,
    actionError,
    activeTab,
    pendingAction,
    reasonInput,
    editForm,
    resetForm,
    lastGeneratedPassword,
    setActiveTab,
    initiateAction,
    cancelAction,
    confirmAction,
    setReasonInput,
    setEditForm,
    setResetForm,
  };
}
