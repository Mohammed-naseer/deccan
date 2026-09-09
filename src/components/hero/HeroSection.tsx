"use client";

import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowUpRight, ShieldCheck, Layers, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-[92vh] flex items-center pt-28 pb-16 overflow-hidden bg-wire-pattern">
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-8">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-deccan-card border border-deccan-cyan/30 text-deccan-cyan text-xs font-mono tracking-widest uppercase shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-deccan-cyan animate-pulse" />
              <span>DECCAN SPACE WORKS · INVISIBLE GRILLS</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]"
            >
              Safety Without <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-deccan-cyan via-cyan-300 to-blue-400">
                Blocking Your View.
              </span>
            </motion.h1>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-300 text-lg sm:text-xl max-w-2xl leading-relaxed font-light"
            >
              Premium invisible grill solutions designed to provide strength, safety and a clean, seamless appearance for modern spaces in Hyderabad.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <Link
                href="#enquiry"
                className="flex items-center justify-center gap-2 text-base font-semibold bg-deccan-cyan text-deccan-dark px-8 py-4 rounded-xl hover:bg-cyan-300 transition-all shadow-xl shadow-deccan-cyan/25 hover:shadow-deccan-cyan/40 hover:-translate-y-0.5"
              >
                <span>Get a Free Site Visit</span>
                <ArrowUpRight className="w-5 h-5" />
              </Link>
              <Link
                href="#specifications"
                className="flex items-center justify-center gap-2 text-base font-medium text-slate-200 hover:text-white px-7 py-4 rounded-xl border border-white/15 hover:border-deccan-cyan/50 hover:bg-white/5 transition-all"
              >
                <span>View Specifications</span>
                <ChevronRight className="w-4 h-4 text-deccan-cyan" />
              </Link>
            </motion.div>

            {/* Technical Specification Bar - Exact PDF Data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-white/10"
            >
              <div className="bg-deccan-card/60 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Wire Options
                </span>
                <span className="font-display font-semibold text-sm sm:text-base text-white">
                  2.5 mm / 3.0 mm
                </span>
                <span className="text-[11px] text-deccan-cyan block">Stainless Steel</span>
              </div>

              <div className="bg-deccan-card/60 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Material Grade
                </span>
                <span className="font-display font-semibold text-sm sm:text-base text-white">
                  SS 316 & SS 304
                </span>
                <span className="text-[11px] text-emerald-400 block">Marine Grade</span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-deccan-card/60 border border-white/10 rounded-xl p-3.5 backdrop-blur-sm">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Tested Strength
                </span>
                <span className="font-display font-semibold text-sm sm:text-base text-white">
                  Up to 400 kg
                </span>
                <span className="text-[11px] text-deccan-cyan block">Tension Load</span>
              </div>
            </motion.div>
          </div>

          {/* Right Hero Visual: Architectural Balcony Image with Technical Overlays */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/80 group"
            >
              <div className="relative aspect-[3/4] w-full bg-deccan-card">
                <Image
                  src="/images/hero_balcony.jpg"
                  alt="Deccan Space Works Invisible Grills installed on high-rise balcony"
                  fill
                  className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                  priority
                />
                
                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-deccan-dark/90 via-transparent to-black/20" />

                {/* Floating Technical Badge Top Right */}
                <div className="absolute top-4 right-4 bg-deccan-dark/80 backdrop-blur-md border border-deccan-cyan/40 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-deccan-cyan" />
                  <span className="text-xs font-mono tracking-wider text-white">400KG TESTED</span>
                </div>

                {/* Floating Specification Card Bottom */}
                <div className="absolute bottom-4 left-4 right-4 bg-deccan-dark/90 backdrop-blur-xl border border-white/15 rounded-xl p-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-deccan-cyan" />
                      <span className="text-xs font-mono font-medium uppercase tracking-wider text-white">
                        Structural Overview
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-deccan-cyan px-2 py-0.5 rounded bg-deccan-cyan/10 border border-deccan-cyan/20">
                      Hyderabad Service
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Core Protection:</span>
                      <span className="text-slate-200 font-medium">Nylon Melt Coated SS</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Track System:</span>
                      <span className="text-slate-200 font-medium">27mm Aluminium Base</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
