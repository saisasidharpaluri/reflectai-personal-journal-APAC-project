import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Cpu,
  Database,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Layers,
  Brain,
  KeyRound,
} from "lucide-react";

interface LandingPageProps {
  onSignInWithGoogle: () => Promise<void>;
  onSignInAsGuest: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignInWithGoogle,
  onSignInAsGuest,
  isLoading,
  authError,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "security">("overview");

  return (
    <div
      id="landing-page"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans"
    >
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-black shadow-sm">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-lg">
              ReflectAI
            </span>
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
              Gemini + Firestore
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "overview" ? "security" : "overview")}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
          >
            {activeTab === "overview" ? "Security Architecture" : "App Overview"}
          </button>
        </div>
      </header>

      {/* Hero & Authentication Card */}
      <main className="max-w-5xl mx-auto w-full px-6 py-12 sm:py-16 flex-1 flex flex-col items-center justify-center text-center">
        {/* Subtle Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-amber-300 mb-6 shadow-inner">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Strict User-Isolated Cloud Firestore Storage</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
          Introspective Journaling Meets{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
            Gemini Intelligence
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          Write multi-turn reflections, explore creative brainstorming, and receive structured executive summaries with Gemini 3.6 Flash. All entries are encrypted and isolated strictly to your account.
        </p>

        {/* Auth Box */}
        <div
          id="auth-container"
          className="mt-10 w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-left space-y-5"
        >
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold text-white">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-slate-400">
              Federated Google Authentication • Zero Password Storage
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{authError}</span>
            </div>
          )}

          {/* Primary Action: Google Sign In */}
          <button
            type="button"
            id="btn-google-sign-in"
            onClick={onSignInWithGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl transition shadow-lg active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isLoading ? "Signing In..." : "Continue with Google"}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold my-2">
            <div className="flex-1 h-px bg-slate-800" />
            <span>OR PREVIEW GUEST</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Secondary Action: Guest Sign In */}
          <button
            type="button"
            id="btn-guest-sign-in"
            onClick={onSignInAsGuest}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition active:scale-98 disabled:opacity-50 cursor-pointer text-center"
          >
            {isLoading ? "Initializing..." : "Instant Guest Preview (Anonymous Auth)"}
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Isolated per-user security rules enforced</span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full text-left">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Multi-Turn Reflections</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore your thoughts through continuous conversation with adaptive coaching, brainstorming, and gratitude lenses.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Gemini 3.6 Flash Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extract structured takeaways, actionable checklists, emotional sentiment tags, and auto-generated reflection titles.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Cloud Firestore Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict owner-bound security rules ensure only your authenticated account can ever read or write your personal archive.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-4 text-center text-xs text-slate-600 max-w-6xl mx-auto w-full">
        ReflectAI • Powered by Google AI Studio, Gemini 3.6 Flash, and Cloud Firestore.
      </footer>
    </div>
  );
};
