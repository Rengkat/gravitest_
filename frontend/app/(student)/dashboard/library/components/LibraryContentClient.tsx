"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import toast from "react-hot-toast";

import { ViewMode, LibraryFilters, LibraryItem } from "@/types/library";
import { htmlToPlainText } from "@/Components/rich-text/RichTextRenderer";

import LibraryHero from "./LibraryHero";
import SearchBar from "./SearchBar";
import ContentTypeTabs from "./ContentTypeTabs";
import FeaturedBanner from "./FeaturedBanner";
import LibraryCard from "./LibraryCard";
import LibraryRow from "./LibraryRow";
import EmptyState from "./EmptyState";
import PremiumCTA from "./PremiumCTA";
import PaywallModal from "./PaywallModal";
import { browseLibrary } from "@/lib/api/library";
import { startContentPurchase } from "@/lib/billing/purchase";
import { mapLibraryContentToLibraryItem } from "@/lib/api/mapLibraryItem";
import { extractErrorMessage } from "@/lib/api/client";
import { isItemLocked } from "@/lib/constants/helpers";

const DEFAULT_FILTERS: LibraryFilters = {
  contentType: "all",
  subject: "all",
  level: "all",
  examType: "all",
  sortMode: "latest",
  searchQuery: "",
  showPremiumOnly: false,
  showFreeOnly: false,
};

export default function LibraryPage() {
  const router = useRouter();

  // ── Real data ────────────────────────────────────────────────────────────
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    browseLibrary({ limit: 100, sortBy: "createdAt", sortOrder: "DESC" })
      .then((res) => {
        if (!cancelled) setItems(res.data.map(mapLibraryContentToLibraryItem));
      })
      .catch((err) => {
        if (!cancelled) toast.error(extractErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<LibraryFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  // ── Interaction state ────────────────────────────────────────────────────
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());

  // ── Paywall modal ────────────────────────────────────────────────────────
  const [paywallItem, setPaywallItem] = useState<LibraryItem | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleLike = useCallback((id: string) => {
    setLikedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAccess = useCallback(
    (item: LibraryItem) => {
      // Only prompt when it is really locked for THIS student. Someone whose plan
      // includes the item (or who already bought it) goes straight in.
      if (isItemLocked(item)) {
        setPaywallItem(item);
      } else {
        router.push(`library/${item.id}`);
      }
    },
    [router],
  );

  const handleShare = useCallback((item: LibraryItem) => {
    if (navigator.share) {
      navigator.share({ title: item.title, text: htmlToPlainText(item.description) });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const updateFilter = <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const activeFilterCount = [
    filters.subject !== "all",
    filters.level !== "all",
    filters.examType !== "all",
    filters.showFreeOnly,
    filters.showPremiumOnly,
  ].filter(Boolean).length;

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      if (filters.contentType !== "all" && item.type !== filters.contentType) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (
          !item.title.toLowerCase().includes(q) &&
          !item.description.toLowerCase().includes(q) &&
          !item.tags.some((t) => t.includes(q))
        )
          return false;
      }
      if (filters.subject !== "all" && item.subject !== filters.subject) return false;
      if (filters.level !== "all" && item.level !== filters.level) return false;
      if (
        filters.examType !== "all" &&
        item.examType !== filters.examType &&
        item.examType !== "all"
      )
        return false;
      if (filters.showFreeOnly && item.isPremium) return false;
      if (filters.showPremiumOnly && !item.isPremium) return false;
      return true;
    });

    switch (filters.sortMode) {
      case "popular":
        result = [...result].sort((a, b) => b.views - a.views);
        break;
      case "rating":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case "latest":
      default:
        result = [...result].sort(
          (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
        );
    }
    return result;
  }, [items, filters]);

  const featuredItems = useMemo(() => items.filter((i) => i.isTrending || i.isNew).slice(0, 6), [items]);

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Hero */}
      <LibraryHero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search + controls */}
        <SearchBar
          filters={filters}
          viewMode={viewMode}
          showFilters={showFilters}
          activeFilterCount={activeFilterCount}
          onSearchChange={(q) => updateFilter("searchQuery", q)}
          onSortChange={(s) => updateFilter("sortMode", s)}
          onViewModeChange={setViewMode}
          onToggleFilters={() => setShowFilters((v) => !v)}
          onSubjectChange={(s) => updateFilter("subject", s)}
          onLevelChange={(l) => updateFilter("level", l)}
          onExamChange={(e) => updateFilter("examType", e)}
          onClearFilters={clearFilters}
        />

        {/* Content type tabs */}
        <ContentTypeTabs
          items={items}
          activeTab={filters.contentType}
          onChange={(tab) => updateFilter("contentType", tab)}
        />

        {/* Featured strip — shown only when no filters active */}
        {activeFilterCount === 0 && !filters.searchQuery && filters.contentType === "all" && (
          <FeaturedBanner items={featuredItems} onAccess={handleAccess} />
        )}

        {/* Results count + clear */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] text-gray-500">
            Showing <span className="font-bold text-gray-800">{filteredItems.length}</span> resource
            {filteredItems.length !== 1 ? "s" : ""}
            {filters.searchQuery && (
              <span className="text-green-700"> for &quot;{filters.searchQuery}&quot;</span>
            )}
          </p>
          {(filters.searchQuery || activeFilterCount > 0) && (
            <button
              onClick={clearFilters}
              className="text-[12px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Grid / List / Empty */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState onReset={clearFilters} />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <LibraryCard
                key={item.id}
                item={item}
                liked={likedItems.has(item.id)}
                bookmarked={bookmarkedItems.has(item.id)}
                onLike={() => toggleLike(item.id)}
                onBookmark={() => toggleBookmark(item.id)}
                onShare={() => handleShare(item)}
                onAccess={() => handleAccess(item)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <LibraryRow
                key={item.id}
                item={item}
                liked={likedItems.has(item.id)}
                bookmarked={bookmarkedItems.has(item.id)}
                onLike={() => toggleLike(item.id)}
                onBookmark={() => toggleBookmark(item.id)}
                onAccess={() => handleAccess(item)}
              />
            ))}
          </div>
        )}

        {/* Premium CTA */}
        <PremiumCTA />
      </div>

      {/* Paywall modal */}
      {paywallItem && (
        <PaywallModal
          item={paywallItem}
          onClose={() => setPaywallItem(null)}
          onUpgrade={() => {
            setPaywallItem(null);
            // Opens the plan chooser on the billing page.
            router.push("/dashboard/billing?upgrade=1");
          }}
          onBuySingle={
            paywallItem.price
              ? async (gateway) => {
                  const item = paywallItem;
                  try {
                    await startContentPurchase(item.id, gateway);
                    setPaywallItem(null);
                  } catch (err) {
                    toast.error(extractErrorMessage(err));
                  }
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
