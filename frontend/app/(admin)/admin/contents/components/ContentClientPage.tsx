"use client";

import { useState } from "react";
import {
  Library,
  Plus,
  Upload,
  Package,
  BarChart3,
  LayoutGrid,
  List,
  RefreshCw,
  BookOpen,
  Video,
  FileText,
  Image,
  Download,
} from "lucide-react";
import { useContent } from "../useContent";
import { SearchFilterBar } from "./SearchFilterBar";
import { ContentCard } from "./ContentCard";
import { ContentListRow } from "./ContentListRow";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { AddContentModal } from "./AddContentModal";
import { BulkActionsBar } from "./BulkActionsBar";
import { MiniStatCard, Pagination } from "./SharedPrimitives";

type ViewMode = "grid" | "list" | "analytics";

export default function AdminContentPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);

  const {
    stats,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    activeFilterCount,
    clearFilters,
    sortField,
    setSortField,
    sortDirection,
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages,
    filteredItems,
    selectedItems,
    toggleSelect,
    clearSelection,
    addItem,
    deleteItem,
    deleteSelected,
    exportCsv,
    items,
    toggleFeatured,
  } = useContent();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-green-800" />
        <span className="ml-3 text-text-muted text-[14px]">Loading content library…</span>
      </div>
    );
  }

  const handleExportSelected = () => {
    exportCsv(items.filter((i) => selectedItems.has(i.id)));
  };

  const handlePublishSelected = () => {
    // update status of all selected to published
    items
      .filter((i) => selectedItems.has(i.id))
      .forEach((i) => {
        // optimistic — real API call would go here
      });
    clearSelection();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* ─── PAGE HEADER ─── */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl text-green-900 mb-2">Content Library</h1>
            <p className="text-text-muted">
              Manage all educational content — e-books, videos, images, documents and more.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => exportCsv(filteredItems)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-cream transition-all text-[14px] font-medium text-text-muted">
              <Download size={16} />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-cream transition-all text-[14px] font-medium text-text-muted">
              <Upload size={16} />
              Bulk Upload
            </button>
            <button
              onClick={() => setShowAddContent(true)}
              className="flex items-center gap-2 px-5 py-3 bg-green-800 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-semibold text-sm">
              <Plus size={18} />
              Add Content
            </button>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2 mt-4">
          {(
            [
              { mode: "grid", Icon: LayoutGrid, label: "Grid" },
              { mode: "list", Icon: List, label: "List" },
              { mode: "analytics", Icon: BarChart3, label: "Analytics" },
            ] as { mode: ViewMode; Icon: any; label: string }[]
          ).map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 ${
                viewMode === mode
                  ? "bg-green-800 text-white"
                  : "bg-white border border-gray-200 text-text-muted hover:bg-cream"
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ANALYTICS ─── */}
      {viewMode === "analytics" && stats && <AnalyticsDashboard stats={stats} />}

      {/* ─── GRID / LIST ─── */}
      {(viewMode === "grid" || viewMode === "list") && (
        <>
          {/* Quick type stat bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            <MiniStatCard
              icon={Library}
              label="Total"
              value={stats?.totalItems.toLocaleString() ?? "—"}
              color="#2e8b57"
            />
            <MiniStatCard
              icon={BookOpen}
              label="E-Books"
              value={(stats?.byType.ebook ?? 0).toLocaleString()}
              color="#2e8b57"
            />
            <MiniStatCard
              icon={Video}
              label="Videos"
              value={(stats?.byType.video ?? 0).toLocaleString()}
              color="#ef4444"
            />
            <MiniStatCard
              icon={Image}
              label="Images"
              value={(stats?.byType.image ?? 0).toLocaleString()}
              color="#3b82f6"
            />
            <MiniStatCard
              icon={FileText}
              label="Docs"
              value={(stats?.byType.document ?? 0).toLocaleString()}
              color="#f59e0b"
            />
            <MiniStatCard
              icon={Library}
              label="Published"
              value={(stats?.byStatus.published ?? 0).toLocaleString()}
              color="#10b981"
            />
            <MiniStatCard
              icon={Library}
              label="Drafts"
              value={(stats?.byStatus.draft ?? 0).toLocaleString()}
              color="#6b7280"
            />
            <MiniStatCard
              icon={Library}
              label="Revenue"
              value={`₦${((stats?.totalRevenue ?? 0) / 1000000).toFixed(1)}M`}
              color="#8b5cf6"
            />
          </div>

          <SearchFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={filters}
            setFilters={setFilters}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            sortField={sortField}
            setSortField={setSortField}
            resultCount={filteredItems.length}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onRefresh={() => {
              clearFilters();
              setCurrentPage(1);
            }}
          />

          {/* Bulk actions bar */}
          {selectedItems.size > 0 && (
            <BulkActionsBar
              count={selectedItems.size}
              onActivate={handlePublishSelected}
              onDelete={deleteSelected}
              onExport={handleExportSelected}
              onClear={clearSelection}
            />
          )}

          {/* Grid view */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedItems.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  onDelete={deleteItem}
                  onToggleFeatured={() => toggleFeatured(item.id)}
                />
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === "list" && (
            <div className="space-y-3">
              {paginatedItems.map((item) => (
                <ContentListRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  onToggleSelect={toggleSelect}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}

          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        </>
      )}

      {/* ─── MODALS ─── */}
      {showAddContent && (
        <AddContentModal
          onClose={() => setShowAddContent(false)}
          onAdd={(item) => {
            addItem(item);
            setShowAddContent(false);
          }}
        />
      )}
    </div>
  );
}
