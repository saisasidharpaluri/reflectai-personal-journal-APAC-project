import React, { useState } from "react";
import { SummaryResult, JournalEntry } from "../types";
import {
  Sparkles,
  X,
  Check,
  CheckSquare,
  Square,
  Tag,
  Smile,
  FileText,
  Lightbulb,
  ArrowRight,
  Save,
} from "lucide-react";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: SummaryResult | null;
  isLoading: boolean;
  onApplySummaryToEntry: (summary: SummaryResult) => void;
  entryTitle: string;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  summaryData,
  isLoading,
  onApplySummaryToEntry,
  entryTitle,
}) => {
  if (!isOpen) return null;

  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});

  const toggleAction = (idx: number) => {
    setCheckedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="summary-modal"
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                AI Synthesis & Key Takeaways
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Structured insights extracted by Gemini 3.6 Flash
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
            aria-label="Close summary dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-12 text-center space-y-3 animate-pulse">
              <Sparkles className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-800">
                Gemini is synthesizing your journal conversation...
              </p>
              <p className="text-xs text-slate-500">
                Extracting core themes, cognitive patterns, and action items
              </p>
            </div>
          ) : summaryData ? (
            <>
              {/* Suggested Title Bar */}
              {summaryData.suggestedTitle && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                      Suggested Title:
                    </span>
                    <span className="font-semibold text-amber-950 truncate block">
                      "{summaryData.suggestedTitle}"
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full shrink-0">
                    Auto-Crafted
                  </span>
                </div>
              )}

              {/* Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Executive Summary</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-normal">
                  {summaryData.summary}
                </p>
              </div>

              {/* Key Insights */}
              {summaryData.keyInsights && summaryData.keyInsights.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Key Insights & Patterns</span>
                  </h3>
                  <ul className="space-y-1.5">
                    {summaryData.keyInsights.map((insight, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/60"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {summaryData.actionItems && summaryData.actionItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Actionable Next Steps</span>
                  </h3>
                  <div className="space-y-1.5">
                    {summaryData.actionItems.map((action, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleAction(idx)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition text-xs ${
                          checkedActions[idx]
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 line-through opacity-75"
                            : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        {checkedActions[idx] ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment & Tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                {summaryData.sentimentTag && (
                  <div className="flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-slate-500 font-medium">Emotional Tone:</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-xs">
                      {summaryData.sentimentTag}
                    </span>
                  </div>
                )}

                {summaryData.tags && summaryData.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {summaryData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              No summary data available yet.
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition"
          >
            Close
          </button>

          {summaryData && !isLoading && (
            <button
              type="button"
              id="btn-apply-summary"
              onClick={() => {
                onApplySummaryToEntry(summaryData);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Attach Summary & Save to Entry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
