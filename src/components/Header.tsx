import React from "react";
import { UserProfile } from "../types";
import {
  Sparkles,
  LogOut,
  Plus,
  Cloud,
  CloudOff,
  RefreshCw,
  BarChart3,
  User as UserIcon,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface HeaderProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenAnalytics: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  syncStatus: "synced" | "saving" | "error";
  totalEntriesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenAnalytics,
  isSidebarOpen,
  onToggleSidebar,
  syncStatus,
  totalEntriesCount,
}) => {
  return (
    <header
      id="main-header"
      className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      {/* Left section: App branding & Sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          title={isSidebarOpen ? "Collapse Journal History" : "Open Journal History"}
          aria-label="Toggle history sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-900/10">
            <Sparkles className="w-4.5 h-4.5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 tracking-tight text-base">
                ReflectAI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 font-medium">
              Private Cognitive Journal & AI Synthesis
            </p>
          </div>
        </div>
      </div>

      {/* Center/Right section: Sync status, Actions, and User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Indicator */}
        <div
          id="sync-status-indicator"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-600"
          title={
            syncStatus === "saving"
              ? "Saving to Cloud Firestore..."
              : syncStatus === "synced"
              ? "All changes persisted to your isolated Firestore database"
              : "Failed to persist. Check network connection."
          }
        >
          {syncStatus === "saving" ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span className="text-amber-700">Saving...</span>
            </>
          ) : syncStatus === "synced" ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Firestore Synced</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-rose-700">Sync Error</span>
            </>
          )}
        </div>

        {/* New Reflection Button */}
        <button
          type="button"
          id="btn-new-reflection"
          onClick={onNewEntry}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>New Reflection</span>
        </button>

        {/* Analytics Toggle */}
        <button
          type="button"
          id="btn-open-analytics"
          onClick={onOpenAnalytics}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          title="View Reflection Analytics"
          aria-label="View Insights & Analytics"
        >
          <BarChart3 className="w-4.5 h-4.5" />
        </button>

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                {user?.displayName || (user?.isAnonymous ? "Guest Explorer" : user?.email?.split("@")[0] || "User")}
              </p>
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                <ShieldCheck className="w-3 h-3" />
                Isolated UID
              </span>
            </div>
          </div>

          <button
            type="button"
            id="btn-sign-out"
            onClick={onSignOut}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
