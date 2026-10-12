"use client";

import { RefreshCw } from "lucide-react";
import { useContentDetail, type DetailTab } from "../Usecontentdetail";
import { ContentDetailHeader } from "./ContentDetailHeader";
import { PreviewTab } from "./PreviewTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { AccessTab } from "./AccessTab";
import { ActivityTab } from "./ActivityTab";
import { AdminActionsPanel } from "./AdminActionsPanel";
import { ActionModal } from "./ActionModal";

const TABS: { id: DetailTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "analytics", label: "Analytics" },
  { id: "access", label: "Access" },
  { id: "activity", label: "Activity" },
];

export function ContentDetailView({ id }: { id: string }) {
  const contentId = id;
  const {
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
  } = useContentDetail(contentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-text-muted text-[14px]">
        <RefreshCw size={20} className="animate-spin text-green-800" /> Loading…
      </div>
    );
  }

  if (!item) {
    return (
      <div
        className="flex items-center justify-center h-64 text-text-muted text-[14px]"
        role="alert">
        Content not found.
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ContentDetailHeader item={item} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
          <main>
            {/* Tab bar */}
            <div
              className="flex gap-1 border-b mb-5"
              style={{ borderColor: "rgba(30,80,50,0.1)" }}
              // TODO: add role="tablist" and role="tab" to the buttons, but aria-selected doesn't update on click. Need to investigate if this is a React issue or something else
              // role="tablist"
              aria-label="Content sections">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  // TODO: aria-selected doesn't update on click. Need to investigate if this is a React issue or something else
                  // role="tab"
                  id={`tab-${tab.id}`}
                  // aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-all ${
                    activeTab === tab.id
                      ? "border-green-800 text-green-900 font-semibold"
                      : "border-transparent text-text-muted hover:text-green-900"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              id="panel-preview"
              role="tabpanel"
              aria-labelledby="tab-preview"
              hidden={activeTab !== "preview"}>
              <PreviewTab item={item} />
            </div>
            <div
              id="panel-analytics"
              role="tabpanel"
              aria-labelledby="tab-analytics"
              hidden={activeTab !== "analytics"}>
              <AnalyticsTab item={item} />
            </div>
            <div
              id="panel-access"
              role="tabpanel"
              aria-labelledby="tab-access"
              hidden={activeTab !== "access"}>
              <AccessTab item={item} />
            </div>
            <div
              id="panel-activity"
              role="tabpanel"
              aria-labelledby="tab-activity"
              hidden={activeTab !== "activity"}>
              <ActivityTab contentId={item.id} />
            </div>
          </main>

          <AdminActionsPanel item={item} onAction={initiateAction} />
        </div>
      </div>

      {pendingAction && (
        <ActionModal
          actionType={pendingAction}
          item={item}
          confirmInput={confirmInput}
          editForm={editForm}
          accessForm={accessForm}
          loading={actionLoading}
          onConfirmInputChange={setConfirmInput}
          onEditFormChange={setEditForm}
          onAccessFormChange={setAccessForm}
          onConfirm={confirmAction}
          onCancel={cancelAction}
        />
      )}
    </>
  );
}
