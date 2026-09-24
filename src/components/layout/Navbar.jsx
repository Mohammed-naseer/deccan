"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig, navItems } from "@/config/site";
import { Phone, MessageSquare, Menu, X, ArrowUpRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-deccan-dark/90 backdrop-blur-md border-b border-white/10 py-3 shadow-xl shadow-black/40"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="#hero" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 group-hover:border-deccan-cyan transition-colors">
            <Image
              src="/images/logo.jpg"
              alt="Deccan Space Works logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold tracking-wider text-sm sm:text-base lg:text-lg text-white group-hover:text-deccan-cyan transition-colors leading-tight">
              DECCAN SPACE WORKS
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-widest text-deccan-cyan font-mono uppercase">
              Invisible Grills
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-5" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs font-medium text-slate-300 hover:text-deccan-cyan transition-colors tracking-wide whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Desktop CTA */}
        <div className="hidden xl:flex items-center gap-3">
          {/* Theme Toggle — Desktop */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-lg border border-white/10 hover:border-deccan-cyan/40 text-slate-300 hover:text-deccan-cyan transition-all"
          >
            {isDark ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <Link
            href={`tel:${siteConfig.phones[0]}`}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-white/10 hover:border-deccan-cyan/40 transition-all whitespace-nowrap"
            aria-label={`Call us at ${siteConfig.displayPhone}`}
          >
            <Phone className="w-3.5 h-3.5 text-deccan-cyan flex-shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{siteConfig.displayPhone}</span>
          </Link>
          <Link
            href="#enquiry"
            className="flex items-center gap-2 text-sm font-semibold bg-deccan-cyan text-deccan-dark px-4 py-2.5 rounded-full hover:bg-cyan-300 transition-all shadow-lg shadow-deccan-cyan/20 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <span className="whitespace-nowrap">Free Site Visit</span>
            <ArrowUpRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile Buttons */}
        <div className="flex items-center gap-2 xl:hidden">
          {/* Theme Toggle — Mobile */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-full border border-white/15 text-slate-300 hover:text-deccan-cyan transition-all"
          >
            {isDark ? (
              <Sun className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <Link
            href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
              siteConfig.whatsappMessage
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="p-2 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            href={`tel:${siteConfig.phones[0]}`}
            aria-label={`Call us at ${siteConfig.displayPhone}`}
            className="p-2 rounded-full bg-deccan-card text-deccan-cyan border border-deccan-cyan/30"
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            className="p-2 text-slate-200 hover:text-white"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
          className="xl:hidden bg-deccan-dark/98 backdrop-blur-xl border-b border-white/10 px-5 sm:px-6 py-5 sm:py-6 space-y-4"
        >
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-200 hover:text-deccan-cyan py-1 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <Link
              href="#enquiry"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full text-center font-semibold bg-deccan-cyan text-deccan-dark py-3 rounded-xl shadow-lg hover:bg-cyan-300 transition-all"
            >
              <span>Get a Free Site Visit</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <Link
                href={`tel:${siteConfig.phones[0]}`}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-deccan-card border border-white/10 text-slate-200 hover:border-deccan-cyan/40 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-deccan-cyan" aria-hidden="true" />
                <span>Call Us</span>
              </Link>
              <Link
                href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                  siteConfig.whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400/60 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>WhatsApp</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
