import React from "react";
import { JournalEntry } from "../types";
import {
  BarChart3,
  X,
  BookOpen,
  Sparkles,
  Smile,
  Calendar,
  Flame,
  CheckCircle2,
} from "lucide-react";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  if (!isOpen) return null;

  const totalEntries = entries.length;
  const totalWords = entries.reduce((acc, e) => acc + (e.wordCount || 0), 0);
  const totalMessages = entries.reduce(
    (acc, e) => acc + (e.messages?.length || 0),
    0
  );

  // Calculate sentiment distribution
  const sentimentCounts: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.sentimentTag) {
      sentimentCounts[e.sentimentTag] = (sentimentCounts[e.sentimentTag] || 0) + 1;
    }
  });

  // Calculate category distribution
  const categoryCounts: Record<string, number> = {};
  entries.forEach((e) => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="analytics-modal"
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Reflection Metrics & Insights
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cognitive journaling analytics from your Firestore archive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
            aria-label="Close analytics dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Key metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Entries
              </span>
              <p className="text-xl font-extrabold text-slate-900">{totalEntries}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Words Expressed
              </span>
              <p className="text-xl font-extrabold text-indigo-600">{totalWords}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                AI Interactions
              </span>
              <p className="text-xl font-extrabold text-amber-600">{totalMessages}</p>
            </div>
          </div>

          {/* Categories breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reflection Categories
            </h3>
            <div className="space-y-2">
              {Object.keys(categoryCounts).length === 0 ? (
                <p className="text-xs text-slate-400">No categories recorded yet.</p>
              ) : (
                Object.entries(categoryCounts).map(([cat, count]) => {
                  const percent = Math.round((count / Math.max(1, totalEntries)) * 100);
                  return (
                    <div key={cat} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium text-slate-700">
                        <span className="capitalize">{cat.replace("_", " ")}</span>
                        <span className="text-slate-500">
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Emotional Tone Palette
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(sentimentCounts).length === 0 ? (
                <p className="text-xs text-slate-400">
                  Summarize an entry with Gemini to detect emotional tone.
                </p>
              ) : (
                Object.entries(sentimentCounts).map(([tag, count]) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>{tag}</span>
                    <span className="bg-indigo-200/60 px-1.5 py-0.2 rounded-full text-[10px]">
                      {count}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
