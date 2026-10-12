"use client";

import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { useUserDetail } from "../useUserDetail";
import { useAuthStore } from "@/lib/store/authStore";
import { UserDetailHeader } from "./UserDetailHeader";
import { OverviewTab } from "./OverviewTab";
import { ActivityTab, BillingTab } from "./TabPanels";
import { AdminActionsPanel } from "./AdminActionsPanel";
import { ActionModal } from "./ActionModal";

const TABS = [
  { id: "overview" as const, label: "Overview" },
  { id: "activity" as const, label: "Activity" },
  { id: "payments" as const, label: "Billing & Payments" },
];

export function UserDetailView({ userId }: { userId: string }) {
  const currentUser = useAuthStore((s) => s.user);
  // GET /users/:id is super_admin-only on the backend — a plain "admin"
  // hitting this page directly would get a 403. Checked here so they see
  // a clear explanation instead of a raw error state.
  const canView = currentUser?.role === "super_admin";

  const {
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
  } = useUserDetail(userId);

  if (!canView) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <ShieldAlert size={32} className="mx-auto mb-3 text-amber-400" />
        <p className="text-text-muted">
          Viewing individual user profiles requires super admin access.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-green-800" />
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <AlertTriangle size={32} className="mx-auto mb-3 text-red-400" />
        <p className="text-text-muted">Couldn&apos;t load this user{loadError ? ` (${loadError})` : ""}.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <UserDetailHeader user={user} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 border-b" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-[13px] font-medium transition-all relative ${
                  activeTab === tab.id ? "text-green-800" : "text-text-muted hover:text-green-700"
                }`}>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-800 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {activeTab === "overview" && <OverviewTab user={user} studentOverview={studentOverview} />}
          {activeTab === "activity" && <ActivityTab sessions={sessions} />}
          {activeTab === "payments" && (
            <BillingTab billing={billing} billingFailed={billingFailed} transactions={transactions} />
          )}
        </div>

        <div>
          <AdminActionsPanel user={user} onAction={initiateAction} />
        </div>
      </div>

      {pendingAction && (
        <ActionModal
          action={pendingAction}
          userName={user.fullName}
          loading={actionLoading}
          error={actionError}
          reasonInput={reasonInput}
          setReasonInput={setReasonInput}
          editForm={editForm}
          setEditForm={setEditForm}
          resetForm={resetForm}
          setResetForm={setResetForm}
          lastGeneratedPassword={lastGeneratedPassword}
          onConfirm={confirmAction}
          onCancel={cancelAction}
        />
      )}
    </div>
  );
}
