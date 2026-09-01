import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  auth,
  signInWithGoogle,
  signInAsGuest,
  signOutUser,
  onAuthStateChanged,
  User,
} from "./firebase";
import {
  UserProfile,
  JournalEntry,
  ChatMessage,
  ReflectionCategory,
  SummaryResult,
  PromptIdea,
  ToastMessage,
} from "./types";
import {
  saveJournalEntry,
  subscribeToUserEntries,
  deleteJournalEntry,
  toggleFavorite,
} from "./lib/firestoreService";
import {
  sendChatMessage,
  generateEntrySummary,
  fetchPromptIdeas,
} from "./lib/geminiClient";
import { Header } from "./components/Header";
import { SidebarHistory } from "./components/SidebarHistory";
import { EntryEditor } from "./components/EntryEditor";
import { SummaryModal } from "./components/SummaryModal";
import { AnalyticsModal } from "./components/AnalyticsModal";
import { LandingPage } from "./components/LandingPage";
import { ToastContainer } from "./components/Toast";
import { Sparkles, RefreshCw } from "lucide-react";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Journal Entries & Workspace State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Prompts & Inspiration
  const [promptIdeas, setPromptIdeas] = useState<PromptIdea[]>([]);

  // Modals & Panels
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryResult | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Toast notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds if not an actionable error
    if (toast.type !== "error") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to create a new blank entry template
  const createBlankEntry = (userId: string, category: ReflectionCategory = "reflection"): JournalEntry => {
    const now = Date.now();
    return {
      id: "",
      userId,
      title: "New Reflection",
      category,
      messages: [],
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      wordCount: 0,
      tags: [],
    };
  };

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous,
        });
      } else {
        setCurrentUser(null);
        setEntries([]);
        setActiveEntry(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Prompt Ideas once
  useEffect(() => {
    fetchPromptIdeas("general")
      .then((prompts) => setPromptIdeas(prompts))
      .catch((err) => console.warn("Failed to load prompt ideas:", err));
  }, []);

  // 3. Subscribe to user's Firestore entries when authenticated
  useEffect(() => {
    if (!currentUser?.uid) return;

    setSyncStatus("saving");
    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setSyncStatus("synced");

        // If no active entry is selected, select the most recently updated entry or create a blank one
        setActiveEntry((current) => {
          if (!current) {
            return fetchedEntries[0] || createBlankEntry(currentUser.uid);
          }
          // If current entry was updated from another tab/sync, merge it
          const updatedCurrent = fetchedEntries.find((e) => e.id === current.id);
          return updatedCurrent || current;
        });
      },
      (error) => {
        setSyncStatus("error");
        addToast({
          type: "error",
          message: `Firestore Sync Error: ${error.message}`,
        });
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, addToast]);

  // Auth Action Handlers
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      addToast({
        type: "success",
        message: "Successfully signed in via Google. Welcome to your private journal!",
      });
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setAuthError(err.message || "Failed to sign in with Google.");
      addToast({
        type: "error",
        message: `Sign-in failed: ${err.message}`,
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInAsGuest();
      addToast({
        type: "success",
        message: "Signed in as Guest Explorer with private Firestore partition.",
      });
    } catch (err: any) {
      console.error("Guest Sign-in error:", err);
      setAuthError(err.message || "Failed to sign in as guest.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      addToast({
        type: "info",
        message: "Signed out securely.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        message: `Sign-out error: ${err.message}`,
      });
    }
  };

  // Workspace Actions
  const handleNewEntry = () => {
    if (!currentUser?.uid) return;
    const blank = createBlankEntry(currentUser.uid);
    setActiveEntry(blank);
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
  };

  const handleUpdateActiveEntry = (updated: Partial<JournalEntry>) => {
    setActiveEntry((prev) => {
      if (!prev) return null;
      return { ...prev, ...updated, updatedAt: Date.now() };
    });
  };

  // Guaranteed Save to Firestore
  const handleSaveToFirestore = async (): Promise<void> => {
    if (!currentUser?.uid || !activeEntry) return;

    setIsSaving(true);
    setSyncStatus("saving");

    try {
      const savedId = await saveJournalEntry(currentUser.uid, activeEntry);
      setActiveEntry((prev) => (prev ? { ...prev, id: savedId } : null));
      setSyncStatus("synced");
      addToast({
        type: "success",
        message: "Reflection saved to Cloud Firestore.",
      });
    } catch (error: any) {
      setSyncStatus("error");
      addToast({
        type: "error",
        message: `Failed to save entry: ${error.message}`,
        actionLabel: "Retry Save",
        onAction: () => handleSaveToFirestore(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.uid) return;
    if (!window.confirm("Are you sure you want to delete this reflection? This cannot be undone.")) {
      return;
    }

    try {
      await deleteJournalEntry(currentUser.uid, entryId);
      addToast({
        type: "info",
        message: "Reflection deleted.",
      });
      if (activeEntry?.id === entryId) {
        const remaining = entries.filter((entry) => entry.id !== entryId);
        setActiveEntry(remaining[0] || createBlankEntry(currentUser.uid));
      }
    } catch (error: any) {
      addToast({
        type: "error",
        message: `Delete failed: ${error.message}`,
      });
    }
  };

  const handleToggleFavorite = async (
    entryId: string,
    isFavorite: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!currentUser?.uid) return;

    try {
      await toggleFavorite(currentUser.uid, entryId, isFavorite);
      if (activeEntry?.id === entryId) {
        setActiveEntry((prev) => (prev ? { ...prev, isFavorite: !isFavorite } : null));
      }
    } catch (error: any) {
      addToast({
        type: "error",
        message: `Could not toggle star: ${error.message}`,
      });
    }
  };

  // Multi-Turn AI Conversation (Guaranteed Save Verification)
  const handleSendChatMessage = async (
    text: string,
    mode: ReflectionCategory
  ): Promise<void> => {
    if (!currentUser?.uid || !activeEntry) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...activeEntry.messages, userMessage];

    // Automatically set a sensible initial title if it was "New Reflection"
    let title = activeEntry.title;
    if (title === "New Reflection" || !title) {
      title = text.slice(0, 45).trim() + (text.length > 45 ? "..." : "");
    }

    const optimisticEntry: JournalEntry = {
      ...activeEntry,
      title,
      category: mode,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    // Update UI immediately
    setActiveEntry(optimisticEntry);
    setIsGeneratingAI(true);
    setSyncStatus("saving");

    try {
      // 1. Send conversation history to backend Gemini API
      const geminiResponse = await sendChatMessage({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        mode,
        userContext: `User Journal Title: ${title}`,
      });

      const modelMessage: ChatMessage = {
        id: `msg-model-${Date.now()}`,
        role: "model",
        content: geminiResponse.reply,
        timestamp: Date.now(),
        modelUsed: geminiResponse.modelUsed,
      };

      const finalMessages = [...updatedMessages, modelMessage];
      const entryToSave: JournalEntry = {
        ...optimisticEntry,
        messages: finalMessages,
        updatedAt: Date.now(),
      };

      setActiveEntry(entryToSave);

      // 2. Persist both user prompt AND Gemini response to Firestore (Zero Data Loss)
      const savedId = await saveJournalEntry(currentUser.uid, entryToSave);
      setActiveEntry((prev) => (prev ? { ...prev, id: savedId } : null));
      setSyncStatus("synced");
    } catch (error: any) {
      console.error("AI Generation / Save Error:", error);
      setSyncStatus("error");
      addToast({
        type: "error",
        message: `Reflection synthesis issue: ${error.message}`,
        actionLabel: "Retry Generation",
        onAction: () => handleSendChatMessage(text, mode),
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Generate Structured AI Summary & Insights
  const handleOpenSummary = async () => {
    if (!activeEntry || activeEntry.messages.length === 0) {
      addToast({
        type: "info",
        message: "Please write a reflection or converse with Gemini before generating a summary.",
      });
      return;
    }

    setIsSummaryModalOpen(true);
    setIsSummarizing(true);

    try {
      const summary = await generateEntrySummary({
        title: activeEntry.title,
        messages: activeEntry.messages,
      });
      setSummaryData(summary);
    } catch (error: any) {
      console.error("Summary generation error:", error);
      addToast({
        type: "error",
        message: `Summarization error: ${error.message}`,
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  // Apply and Persist Summary to Entry
  const handleApplySummaryToEntry = async (summary: SummaryResult) => {
    if (!currentUser?.uid || !activeEntry) return;

    const updated: Partial<JournalEntry> = {
      title: summary.suggestedTitle || activeEntry.title,
      summary: summary.summary,
      keyInsights: summary.keyInsights,
      actionItems: summary.actionItems,
      sentimentTag: summary.sentimentTag,
      tags: summary.tags,
      updatedAt: Date.now(),
    };

    const mergedEntry: JournalEntry = {
      ...activeEntry,
      ...updated,
    };

    setActiveEntry(mergedEntry);

    try {
      await saveJournalEntry(currentUser.uid, mergedEntry);
      addToast({
        type: "success",
        message: "Summary and action items successfully attached and saved to Firestore.",
      });
    } catch (error: any) {
      addToast({
        type: "error",
        message: `Failed to persist summary: ${error.message}`,
      });
    }
  };

  // Loading Screen for Initial Auth Check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-slate-100">
            Initializing ReflectAI Workspace
          </h2>
          <p className="text-xs text-slate-400">
            Verifying Firebase Authentication & Cloud Firestore credentials...
          </p>
        </div>
      </div>
    );
  }

  // If Not Authenticated, Show Landing & Sign-in Page
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onSignInWithGoogle={handleGoogleSignIn}
          onSignInAsGuest={handleGuestSignIn}
          isLoading={isAuthLoading}
          authError={authError}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Main Authenticated Dashboard
  return (
    <div id="app-root" className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        user={currentUser}
        onSignOut={handleSignOut}
        onNewEntry={handleNewEntry}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        syncStatus={syncStatus}
        totalEntriesCount={entries.length}
      />

      {/* Main Layout: History Sidebar + Active Entry Canvas */}
      <div className="flex-1 flex overflow-hidden">
        <SidebarHistory
          entries={entries}
          activeEntryId={activeEntry?.id || null}
          onSelectEntry={handleSelectEntry}
          onDeleteEntry={handleDeleteEntry}
          onToggleFavorite={handleToggleFavorite}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          userId={currentUser.uid}
        />

        {activeEntry ? (
          <EntryEditor
            entry={activeEntry}
            onUpdateEntry={handleUpdateActiveEntry}
            onSaveToFirestore={handleSaveToFirestore}
            onGenerateSummary={handleOpenSummary}
            onSendChatMessage={handleSendChatMessage}
            isGenerating={isGeneratingAI}
            promptIdeas={promptIdeas}
            isSaving={isSaving}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white text-slate-400 text-sm">
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
              <p>Select a reflection from history or start a new one.</p>
              <button
                type="button"
                onClick={handleNewEntry}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                Create Reflection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryData={summaryData}
        isLoading={isSummarizing}
        onApplySummaryToEntry={handleApplySummaryToEntry}
        entryTitle={activeEntry?.title || "Reflection"}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        entries={entries}
      />

      {/* Global Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
