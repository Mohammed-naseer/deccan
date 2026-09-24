"use client";

import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Phone, MessageSquare, ArrowUpRight, Calendar, Users, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function WhatsAppCTABanner() {
  return (
    <section className="py-16 bg-gradient-to-r from-deccan-card via-deccan-dark to-deccan-card border-y border-white/10 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">

          {/* Left Column: Direct Action & Contacts */}
          <div className="space-y-4 max-w-xl text-center lg:text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block">
              WHATSAPP &amp; CALL
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Ready to Upgrade Your Living Space?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base font-light">
              Speak directly with our technical team in Hyderabad for instant guidance, quick pricing estimates, and site scheduling.
            </p>

            {/* Direct Phone & WhatsApp badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={`tel:${siteConfig.phones[0]}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-deccan-card border border-white/15 text-white font-mono text-sm hover:border-deccan-cyan/50 transition-colors"
                aria-label={`Call us at ${siteConfig.displayPhone}`}
              >
                <Phone className="w-4 h-4 text-deccan-cyan" />
                <span>{siteConfig.displayPhone}</span>
              </a>

              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                  siteConfig.whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-sm hover:border-emerald-400 transition-colors"
                aria-label="Chat with us on WhatsApp"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Available</span>
              </a>
            </div>
          </div>

          {/* Center/Right: 3 Points & Booking Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end gap-6 w-full lg:w-auto">
            {/* 3 Benefit Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full sm:w-auto text-center">
              <div className="p-3 sm:p-4 rounded-xl bg-deccan-card/80 border border-white/10">
                <HelpCircle className="w-4 h-4 text-deccan-cyan mx-auto mb-1" />
                <span className="font-display font-bold text-xs sm:text-sm text-white block">
                  Free Consultation
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-light block">
                  Discuss requirements
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-deccan-card/80 border border-white/10">
                <Calendar className="w-4 h-4 text-deccan-cyan mx-auto mb-1" />
                <span className="font-display font-bold text-xs sm:text-sm text-white block">
                  On-Site Visit
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-light block">
                  At your convenience
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-deccan-card/80 border border-white/10">
                <Users className="w-4 h-4 text-deccan-cyan mx-auto mb-1" />
                <span className="font-display font-bold text-xs sm:text-sm text-white block">
                  Trusted by 8,000+
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-light block">
                  Happy customers
                </span>
              </div>
            </div>

            {/* Main Button */}
            <Link
              href="#enquiry"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-deccan-cyan text-deccan-dark font-display font-bold text-sm sm:text-base hover:bg-cyan-300 transition-all shadow-xl shadow-deccan-cyan/20 w-full sm:w-auto hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Book Free Site Visit</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
