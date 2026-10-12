"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Download,
  LayoutGrid,
  List,
  BarChart3,
  Loader2,
  GraduationCap,
  Briefcase,
  UserCheck,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useUsers } from "../useUsers";
import { SearchFilterBar } from "./SearchFilterBar";
import { UserTableRow } from "./UserTableRow";
import { UserGridCard } from "./UserGridCard";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { BulkActionsBar, AddUserModal } from "./BulkActions";
import { MiniStatCard, Pagination } from "./Primitives";
import { InviteAdminModal } from "./InviteAdminModal";
import { PendingInvitesPanel } from "./PendingInvitesPanel";
import { useAuthStore } from "@/lib/store/authStore";

type ViewMode = "table" | "grid" | "analytics";
const MUTATOR_ROLES = new Set(["super_admin"]);

export default function AdminUsersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showInviteAdmin, setShowInviteAdmin] = useState(false);
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0);
  const currentUser = useAuthStore((s) => s.user);
  // Most mutations (create, edit, deactivate, reset password) are
  // super_admin-only on the backend — a plain "admin" can list and view,
  // but action buttons that would 403 are hidden rather than shown and
  // failing.
  const canMutate = !!currentUser && MUTATOR_ROLES.has(currentUser.role);

  const {
    users,
    stats,
    loading,
    error,
    totalItems,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    activeFilterCount,
    clearFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    totalPages,
    selectedUsers,
    toggleSelect,
    clearSelection,
    selectAll,
    deactivate,
    reactivate,
    bulkDeactivate,
    bulkReactivate,
    exportCsv,
    refresh,
  } = useUsers();

  return (
    <div className="max-w-7xl mx-auto">
      {/* ─── PAGE HEADER ─── */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl text-green-900 mb-2">User Management</h1>
            <p className="text-text-muted">
              Manage all students, professionals, and admins on Gravitest.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportCsv(users)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-cream transition-all text-[14px] font-medium text-text-muted">
              <Download size={16} />
              Export Page
            </button>

            {canMutate && (
              <>
                <button
                  onClick={() => setShowInviteAdmin(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-purple-700 text-white rounded-xl hover:bg-purple-600 transition-all shadow-lg hover:shadow-xl font-semibold text-sm">
                  <Mail size={18} />
                  Invite Admin
                </button>

                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-green-800 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-semibold text-sm">
                  <Plus size={18} />
                  Add User
                </button>
              </>
            )}
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2 mt-4">
          {(
            [
              { mode: "table", Icon: List, label: "List" },
              { mode: "grid", Icon: LayoutGrid, label: "Grid" },
              { mode: "analytics", Icon: BarChart3, label: "Analytics" },
            ] as { mode: ViewMode; Icon: any; label: string }[]
          ).map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 ${
                viewMode === mode ? "bg-green-800 text-white" : "bg-white border border-gray-200 text-text-muted hover:bg-cream"
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "analytics" && stats && <AnalyticsDashboard stats={stats} />}

      {(viewMode === "table" || viewMode === "grid") && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MiniStatCard icon={Users} label="Total" value={(stats?.total ?? 0).toLocaleString()} color="#2e8b57" />
            <MiniStatCard
              icon={GraduationCap}
              label="Students"
              value={(stats?.students ?? 0).toLocaleString()}
              color="#0284c7"
            />
            <MiniStatCard
              icon={Briefcase}
              label="Professionals"
              value={(stats?.professionals ?? 0).toLocaleString()}
              color="#8b5cf6"
            />
            <MiniStatCard icon={UserCheck} label="Active" value={(stats?.active ?? 0).toLocaleString()} color="#10b981" />
          </div>

          {canMutate && <PendingInvitesPanel refreshKey={inviteRefreshKey} />}

          <SearchFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            setFilters={setFilters}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            resultCount={totalItems}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={24} className="animate-spin text-green-800" />
              <span className="ml-3 text-text-muted text-[14px]">Loading users…</span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
              <p className="text-text-muted">Couldn&apos;t load users ({error}).</p>
            </div>
          ) : (
            <>
              {canMutate && viewMode === "table" && users.length > 0 && (
                <div className="flex items-center gap-3 mb-3 text-[13px] text-text-muted">
                  <input
                    title="select all"
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={() => (selectedUsers.size === users.length ? clearSelection() : selectAll())}
                    className="w-4 h-4 rounded border-gray-300 text-green-800"
                  />
                  <span>{selectedUsers.size > 0 ? `${selectedUsers.size} selected` : `Select all on this page`}</span>
                </div>
              )}

              {selectedUsers.size > 0 && (
                <BulkActionsBar
                  count={selectedUsers.size}
                  onActivate={bulkReactivate}
                  onDeactivate={bulkDeactivate}
                  onExport={() => exportCsv(users.filter((u) => selectedUsers.has(u.id)))}
                  onClear={clearSelection}
                />
              )}

              {users.length === 0 ? (
                <div className="text-center py-16 text-text-muted text-[14px]">
                  No users match your current filters.
                </div>
              ) : viewMode === "table" ? (
                <div className="space-y-3">
                  {users.map((user) => (
                    <UserTableRow
                      key={user.id}
                      user={user}
                      isSelected={selectedUsers.has(user.id)}
                      onToggleSelect={toggleSelect}
                      onDeactivate={deactivate}
                      onReactivate={reactivate}
                      canMutate={canMutate}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((user) => (
                    <UserGridCard
                      key={user.id}
                      user={user}
                      onDeactivate={deactivate}
                      onReactivate={reactivate}
                      canMutate={canMutate}
                    />
                  ))}
                </div>
              )}

              <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
            </>
          )}
        </>
      )}

      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onAdd={() => {
            refresh();
          }}
        />
      )}
      {showInviteAdmin && (
        <InviteAdminModal
          onClose={() => setShowInviteAdmin(false)}
          onInvite={() => {
            refresh();
            setInviteRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
