"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log error securely without exposing sensitive details to user
    console.error("Runtime application error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-deccan-dark text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-7xl mx-auto w-full py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display font-extrabold text-white text-lg tracking-wider group-hover:text-deccan-cyan transition-colors">
            DECCAN SPACE WORKS
          </span>
          <span className="text-[10px] font-mono text-deccan-cyan tracking-widest uppercase">
            Invisible Grills
          </span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto w-full text-center py-16 sm:py-24 space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs uppercase tracking-widest">
          Unexpected Error
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Something Went Wrong
        </h1>

        <p className="text-slate-400 text-base sm:text-lg font-light leading-relaxed max-w-lg mx-auto">
          We encountered an unexpected problem while rendering this page. You can try refreshing the view or return to our homepage.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-deccan-cyan text-deccan-dark font-display font-bold text-sm hover:bg-cyan-300 transition-all shadow-lg shadow-deccan-cyan/20"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-deccan-card border border-white/15 text-slate-200 hover:text-white hover:border-deccan-cyan/40 font-semibold text-sm transition-all"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto w-full py-6 text-center text-xs text-slate-500 border-t border-white/10">
        <p>© 2026 Deccan Space Works · Hyderabad, Telangana</p>
      </footer>
    </div>
  );
}
