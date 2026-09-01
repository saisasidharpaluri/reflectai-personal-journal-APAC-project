import React, { useState, useMemo } from "react";
import { JournalEntry, ReflectionCategory } from "../types";
import {
  Search,
  BookOpen,
  Sparkles,
  Lightbulb,
  Compass,
  CheckSquare,
  Heart,
  Star,
  Trash2,
  Calendar,
  Lock,
  MessageSquare,
} from "lucide-react";

interface SidebarHistoryProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string, e: React.MouseEvent) => void;
  onToggleFavorite: (entryId: string, isFavorite: boolean, e: React.MouseEvent) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  userId: string;
}

const CATEGORY_ICONS: Record<ReflectionCategory, React.ReactNode> = {
  reflection: <BookOpen className="w-3.5 h-3.5 text-indigo-600" />,
  brainstorm: <Lightbulb className="w-3.5 h-3.5 text-amber-600" />,
  coaching: <Compass className="w-3.5 h-3.5 text-emerald-600" />,
  action_plan: <CheckSquare className="w-3.5 h-3.5 text-blue-600" />,
  gratitude: <Heart className="w-3.5 h-3.5 text-rose-600" />,
  freeform: <Sparkles className="w-3.5 h-3.5 text-purple-600" />,
};

export const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onDeleteEntry,
  onToggleFavorite,
  isOpen,
  onCloseMobile,
  userId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Category filter
      if (selectedFilter === "favorites" && !entry.isFavorite) return false;
      if (
        selectedFilter !== "all" &&
        selectedFilter !== "favorites" &&
        entry.category !== selectedFilter
      ) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const inTitle = entry.title.toLowerCase().includes(query);
      const inSummary = (entry.summary || "").toLowerCase().includes(query);
      const inTags = (entry.tags || []).some((t) => t.toLowerCase().includes(query));
      const inMessages = entry.messages.some((m) =>
        m.content.toLowerCase().includes(query)
      );

      return inTitle || inSummary || inTags || inMessages;
    });
  }, [entries, searchQuery, selectedFilter]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="history-sidebar"
        className={`fixed lg:static top-16 bottom-0 left-0 z-30 w-80 sm:w-88 bg-slate-50/95 border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:hidden"
        }`}
      >
        {/* Search & Header */}
        <div className="p-4 border-b border-slate-200/80 space-y-3 bg-white/60">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Journal History</span>
              <span className="text-[11px] font-semibold bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded-full">
                {entries.length}
              </span>
            </h2>
            <div
              className="flex items-center gap-1 text-[11px] text-slate-500 font-medium"
              title="Protected by Firestore security rules (/users/{userId}/...)"
            >
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Isolated</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-history"
              placeholder="Search reflections, insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            {[
              { id: "all", label: "All" },
              { id: "favorites", label: "★ Starred" },
              { id: "reflection", label: "Reflections" },
              { id: "brainstorm", label: "Brainstorms" },
              { id: "coaching", label: "Coaching" },
              { id: "action_plan", label: "Action Plans" },
              { id: "gratitude", label: "Gratitude" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                id={`filter-${tab.id}`}
                onClick={() => setSelectedFilter(tab.id)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md font-medium transition ${
                  selectedFilter === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs font-medium text-slate-500">
                {searchQuery || selectedFilter !== "all"
                  ? "No reflections match your filter."
                  : "No journal entries yet. Click 'New Reflection' to begin your first session."}
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isActive = entry.id === activeEntryId;
              const previewSnippet =
                entry.summary ||
                entry.messages[entry.messages.length - 1]?.content ||
                entry.initialPrompt ||
                "No content yet...";

              return (
                <div
                  key={entry.id}
                  id={`entry-card-${entry.id}`}
                  onClick={() => onSelectEntry(entry)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-white border-slate-900 shadow-sm ring-1 ring-slate-900/5"
                      : "bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="p-1 rounded-md bg-slate-100 shrink-0">
                        {CATEGORY_ICONS[entry.category] || <BookOpen className="w-3.5 h-3.5 text-slate-600" />}
                      </span>
                      <h3 className="text-xs font-semibold text-slate-900 truncate">
                        {entry.title || "Untitled Reflection"}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => onToggleFavorite(entry.id, Boolean(entry.isFavorite), e)}
                        className={`p-1 rounded-md hover:bg-slate-100 transition ${
                          entry.isFavorite ? "text-amber-500" : "text-slate-300 opacity-0 group-hover:opacity-100"
                        }`}
                        title={entry.isFavorite ? "Remove favorite" : "Star reflection"}
                        aria-label="Star reflection"
                      >
                        <Star className={`w-3.5 h-3.5 ${entry.isFavorite ? "fill-amber-400" : ""}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => onDeleteEntry(entry.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition opacity-0 group-hover:opacity-100"
                        title="Delete reflection"
                        aria-label="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2 font-normal">
                    {previewSnippet}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.updatedAt)}
                    </span>

                    <div className="flex items-center gap-2">
                      {entry.sentimentTag && (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-sm font-medium">
                          {entry.sentimentTag}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-slate-500">
                        <MessageSquare className="w-3 h-3" />
                        {entry.messages?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Isolation Footer Note */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-100/60 text-[10px] text-slate-500 flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <p className="truncate">
            Isolation: <span className="font-mono text-slate-700">/users/{userId.slice(0, 8)}...</span>
          </p>
        </div>
      </aside>
    </>
  );
};
