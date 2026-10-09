import Link from "next/link";
import { ArrowLeft, Home, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "404 - Page Not Found | Deccan Space Works",
  description: "The page you are looking for does not exist or has been moved.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-deccan-dark text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full py-4 flex items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display font-extrabold text-white text-lg tracking-wider group-hover:text-deccan-cyan transition-colors">
            DECCAN SPACE WORKS
          </span>
          <span className="text-[10px] font-mono text-deccan-cyan tracking-widest uppercase">
            Invisible Grills
          </span>
        </Link>
        <Link
          href={`tel:${siteConfig.phones[0]}`}
          className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          aria-label={`Call Deccan Space Works at ${siteConfig.displayPhone}`}
        >
          <Phone className="w-3.5 h-3.5 text-deccan-cyan" aria-hidden="true" />
          <span className="hidden sm:inline">{siteConfig.displayPhone}</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full text-center py-16 sm:py-24 space-y-6">
        <div className="inline-block px-3 py-1 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/30 text-deccan-cyan font-mono text-xs uppercase tracking-widest">
          Error 404
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
          Page Not Found
        </h1>

        <p className="text-slate-400 text-base sm:text-lg font-light leading-relaxed max-w-lg mx-auto">
          The link you followed may be broken or the page may have been moved. Return to our homepage to explore invisible grill installations across Hyderabad.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-deccan-cyan text-deccan-dark font-display font-bold text-sm hover:bg-cyan-300 transition-all shadow-lg shadow-deccan-cyan/20"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/#enquiry"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-deccan-card border border-white/15 text-slate-200 hover:text-white hover:border-deccan-cyan/40 font-semibold text-sm transition-all"
          >
            <span>Book a Site Visit</span>
          </Link>
        </div>
      </main>

      {/* Footer info */}
      <footer className="max-w-7xl mx-auto w-full py-6 text-center text-xs text-slate-500 border-t border-white/10">
        <p>© 2026 Deccan Space Works · Hyderabad, Telangana · Premium Invisible Grills</p>
      </footer>
    </div>
  );
}
