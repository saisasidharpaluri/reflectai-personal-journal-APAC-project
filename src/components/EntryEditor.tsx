import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import {
  JournalEntry,
  ChatMessage,
  ReflectionCategory,
  PromptIdea,
} from "../types";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Lightbulb,
  Compass,
  FileText,
  CheckSquare,
  RefreshCw,
  Clock,
  HelpCircle,
  Save,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface EntryEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onSaveToFirestore: () => Promise<void>;
  onGenerateSummary: () => void;
  onSendChatMessage: (text: string, mode: ReflectionCategory) => Promise<void>;
  isGenerating: boolean;
  promptIdeas: PromptIdea[];
  isSaving: boolean;
}

const CATEGORIES: Array<{ id: ReflectionCategory; label: string; description: string }> = [
  { id: "reflection", label: "Reflection", description: "Deep personal thoughts, daily processing, mindfulness" },
  { id: "brainstorm", label: "Brainstorm", description: "Creative concepts, divergent options, solution mapping" },
  { id: "coaching", label: "Coaching", description: "Perspective reframing, introspective challenge questions" },
  { id: "action_plan", label: "Action Plan", description: "Pragmatic milestones, task breakdowns, goal tracking" },
  { id: "gratitude", label: "Gratitude", description: "Appreciations, positive anchors, daily wins" },
];

export const EntryEditor: React.FC<EntryEditorProps> = ({
  entry,
  onUpdateEntry,
  onSaveToFirestore,
  onGenerateSummary,
  onSendChatMessage,
  isGenerating,
  promptIdeas,
  isSaving,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ReflectionCategory>(
    entry.category || "reflection"
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync category state when active entry changes
  useEffect(() => {
    setSelectedCategory(entry.category || "reflection");
  }, [entry.id, entry.category]);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entry.messages, isGenerating]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isGenerating) return;
    const textToSend = inputText.trim();
    setInputText("");
    await onSendChatMessage(textToSend, selectedCategory);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSelectPrompt = (promptText: string) => {
    setInputText((prev) => (prev ? `${prev}\n\n${promptText}` : promptText));
    textareaRef.current?.focus();
  };

  const handleCategoryChange = (category: ReflectionCategory) => {
    setSelectedCategory(category);
    onUpdateEntry({ category });
  };

  const totalWords = entry.messages.reduce(
    (acc, m) => acc + (m.content.trim().split(/\s+/).filter(Boolean).length || 0),
    0
  );

  return (
    <div
      id="entry-editor"
      className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white overflow-hidden"
    >
      {/* Top Bar: Title, Category Selector, AI Action Shortcuts */}
      <div className="border-b border-slate-200/90 px-4 sm:px-6 py-3 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            id="input-entry-title"
            value={entry.title}
            onChange={(e) => onUpdateEntry({ title: e.target.value })}
            placeholder="Title of this reflection..."
            className="w-full text-base sm:text-lg font-bold text-slate-900 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:outline-hidden py-1 px-1 -ml-1 transition"
          />

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {/* Category selector dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-400">Mode:</span>
              <select
                id="select-entry-category"
                value={selectedCategory}
                onChange={(e) =>
                  handleCategoryChange(e.target.value as ReflectionCategory)
                }
                className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-md px-2 py-0.5 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {totalWords} words
            </span>

            {entry.sentimentTag && (
              <>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200/60 text-indigo-700 rounded-md font-medium text-[11px]">
                  {entry.sentimentTag}
                </span>
              </>
            )}
          </div>
        </div>

        {/* AI Actions Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-generate-summary"
            onClick={onGenerateSummary}
            disabled={entry.messages.length === 0 || isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition disabled:opacity-40 cursor-pointer"
            title="Generate AI Executive Summary and Actionable Insights"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summarize & Extract</span>
          </button>

          <button
            type="button"
            id="btn-manual-save"
            onClick={onSaveToFirestore}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition"
            title="Force save changes to Firestore"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : (
              <Save className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Welcome or Empty State for New Entry */}
        {entry.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-800 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Begin Your Reflection Session
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Write freely about what is on your mind, a challenge you are facing, or an idea you want to develop. Gemini 3.6 Flash will assist with constructive perspectives.
              </p>
            </div>

            {/* Prompt Inspirations */}
            {promptIdeas.length > 0 && (
              <div className="pt-4 text-left space-y-2 max-w-xl mx-auto">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Inspiration Prompts for Today</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {promptIdeas.map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPrompt(idea.prompt)}
                      className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300 transition text-xs group cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800 block mb-1 group-hover:text-indigo-600 transition">
                        {idea.title}
                      </span>
                      <span className="text-slate-600 line-clamp-2 leading-relaxed">
                        {idea.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Multi-Turn Thread */
          <div className="max-w-3xl mx-auto space-y-6">
            {entry.messages.map((message) => {
              const isModel = message.role === "model";

              return (
                <div
                  key={message.id}
                  id={`message-${message.id}`}
                  className={`flex items-start gap-3.5 ${
                    isModel ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isModel
                        ? "bg-slate-900 text-amber-300 ring-1 ring-slate-900/10"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group relative max-w-[85%] rounded-2xl p-4 transition-all ${
                      isModel
                        ? "bg-slate-50 border border-slate-200/90 text-slate-800"
                        : "bg-indigo-600 text-white shadow-xs"
                    }`}
                  >
                    {/* Header info */}
                    <div
                      className={`flex items-center justify-between gap-3 text-[11px] font-medium mb-1.5 ${
                        isModel ? "text-slate-500" : "text-indigo-200"
                      }`}
                    >
                      <span>
                        {isModel ? "ReflectAI (Gemini 3.6 Flash)" : "You"}
                      </span>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Content */}
                    <div
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isModel
                          ? "prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-headings:font-bold prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5"
                          : "text-white whitespace-pre-wrap"
                      }`}
                    >
                      {isModel ? (
                        <div className="markdown-body">
                          <Markdown>{message.content}</Markdown>
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>

                    {/* Copy action */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className={`absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition ${
                        isModel
                          ? "text-slate-400 hover:text-slate-700 hover:bg-slate-200/70"
                          : "text-indigo-200 hover:text-white hover:bg-indigo-700"
                      }`}
                      title="Copy text"
                      aria-label="Copy message text"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Thinking / Generation Skeleton */}
            {isGenerating && (
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-300 flex items-center justify-center shrink-0 ring-1 ring-slate-900/10">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 max-w-[85%] space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span>Gemini is synthesizing and reflecting...</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Console & Mode Selector */}
      <div className="border-t border-slate-200/90 bg-white p-3 sm:p-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2.5">
          {/* Quick Reflection Triggers */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider pl-1">
              AI Lens:
            </span>
            {[
              { id: "reflection", label: "🌱 Deep Reflection", prompt: "Help me reflect on what I just shared from a deeper perspective." },
              { id: "brainstorm", label: "💡 Brainstorm Angles", prompt: "Brainstorm 5 creative angles or alternative solutions for this." },
              { id: "coaching", label: "🧭 Coach Me", prompt: "Ask me 3 powerful coaching questions to challenge my thinking." },
              { id: "action_plan", label: "📋 Action Plan", prompt: "Break down what I wrote into a structured 3-step action plan." },
            ].map((lens) => (
              <button
                key={lens.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(lens.id as ReflectionCategory);
                  if (entry.messages.length > 0) {
                    onSendChatMessage(lens.prompt, lens.id as ReflectionCategory);
                  } else {
                    setInputText(lens.prompt);
                  }
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
              >
                {lens.label}
              </button>
            ))}
          </div>

          {/* Textarea Input */}
          <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-400 transition">
            <textarea
              ref={textareaRef}
              id="textarea-user-reflection"
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Write your thoughts, daily journal, or questions (${selectedCategory} mode)...`}
              className="flex-1 bg-transparent resize-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden p-1 min-h-[44px] max-h-36 leading-relaxed"
            />

            <button
              type="button"
              id="btn-submit-reflection"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isGenerating}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-40 cursor-pointer shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Press <kbd className="font-mono bg-slate-100 px-1 rounded-sm text-slate-600">Enter</kbd> to submit, <kbd className="font-mono bg-slate-100 px-1 rounded-sm text-slate-600">Shift+Enter</kbd> for new line</span>
            <span>Gemini 3.6 Flash Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
