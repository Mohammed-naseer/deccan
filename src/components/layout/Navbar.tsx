"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig, navItems } from "@/config/site";
import { Phone, MessageSquare, Menu, X, ArrowUpRight } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              alt="Deccan Space Works"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold tracking-wider text-base sm:text-lg text-white group-hover:text-deccan-cyan transition-colors">
              DECCAN SPACE WORKS
            </span>
            <span className="text-[10px] tracking-widest text-deccan-cyan font-mono uppercase">
              Invisible Grills
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-300 hover:text-deccan-cyan transition-colors tracking-wide"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Desktop CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            href={`tel:${siteConfig.phones[0]}`}
            className="flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-white/10 hover:border-deccan-cyan/40 transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-deccan-cyan" />
            <span>{siteConfig.displayPhone}</span>
          </Link>
          <Link
            href="#enquiry"
            className="flex items-center gap-2 text-sm font-semibold bg-deccan-cyan text-deccan-dark px-5 py-2.5 rounded-full hover:bg-cyan-300 transition-all shadow-lg shadow-deccan-cyan/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Get a Free Site Visit</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Buttons */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
              siteConfig.whatsappMessage
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="p-2 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
          >
            <MessageSquare className="w-4 h-4" />
          </Link>
          <Link
            href={`tel:${siteConfig.phones[0]}`}
            aria-label="Call"
            className="p-2 rounded-full bg-deccan-card text-deccan-cyan border border-deccan-cyan/30"
          >
            <Phone className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 text-slate-200 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-deccan-dark/98 backdrop-blur-xl border-b border-white/10 px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-200 hover:text-deccan-cyan py-1"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <Link
              href="#enquiry"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full text-center font-semibold bg-deccan-cyan text-deccan-dark py-3 rounded-xl shadow-lg"
            >
              <span>Get a Free Site Visit</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <Link
                href={`tel:${siteConfig.phones[0]}`}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-deccan-card border border-white/10 text-slate-200"
              >
                <Phone className="w-3.5 h-3.5 text-deccan-cyan" />
                <span>Call Us</span>
              </Link>
              <Link
                href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                  siteConfig.whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
