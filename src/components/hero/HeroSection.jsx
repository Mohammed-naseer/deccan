"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-24 sm:pt-28 pb-14 overflow-hidden bg-wire-pattern">
      {/* Background Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-deccan-card border border-deccan-cyan/30 text-deccan-cyan text-[10px] sm:text-xs font-mono tracking-widest uppercase shadow-sm"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-deccan-cyan animate-pulse" />
              <span>DECCAN SPACE WORKS · COMPLETE HOME SOLUTIONS</span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-1"
            >
              <span className="block font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-slate-300 tracking-tight">
                Upgrade Your Home With
              </span>
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Smart &amp; Stylish{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-deccan-cyan via-cyan-300 to-blue-400">
                  Solutions
                </span>
              </h1>
            </motion.div>

            {/* Supporting Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-2.5"
            >
              <p className="text-slate-200 text-base sm:text-lg font-medium leading-relaxed">
                Premium Home Safety &amp; Space Management Services
              </p>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-light">
                Invisible Grills • Cloth Hangers • Mosquito Mesh • UPVC Windows • Shoe Racks • Security Screen Doors
              </p>
            </motion.div>

            {/* Trust / Key Features Badges */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1"
            >
              {[
                "Safer Homes",
                "Modern Look",
                "Low Maintenance",
                "Premium Quality",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-1.5 p-2 rounded-lg bg-deccan-card/60 border border-white/10"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-deccan-cyan flex-shrink-0" />
                  <span className="text-[11px] sm:text-xs text-slate-200 font-medium whitespace-nowrap">
                    {feature}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
            >
              <Link
                href="#enquiry"
                className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold bg-deccan-cyan text-deccan-dark px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl hover:bg-cyan-300 transition-all shadow-xl shadow-deccan-cyan/25 hover:shadow-deccan-cyan/40 hover:-translate-y-0.5"
              >
                <span>Get a Free Site Visit</span>
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="#products"
                className="flex items-center justify-center gap-2 text-sm sm:text-base font-medium text-slate-200 hover:text-white px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl border border-white/15 hover:border-deccan-cyan/50 hover:bg-white/5 transition-all"
              >
                <span>View Our Products</span>
                <ChevronRight className="w-4 h-4 text-deccan-cyan" />
              </Link>
            </motion.div>

            {/* Approved Hero Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-white/10"
            >
              <div className="bg-deccan-card/60 border border-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <span className="font-display font-extrabold text-lg sm:text-2xl text-white block">
                  8,000+
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-light block leading-tight mt-0.5">
                  Installations in Hyderabad
                </span>
              </div>

              <div className="bg-deccan-card/60 border border-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <span className="font-display font-extrabold text-lg sm:text-2xl text-deccan-cyan block">
                  100%
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-light block leading-tight mt-0.5">
                  Customer Satisfaction
                </span>
              </div>

              <div className="bg-deccan-card/60 border border-white/10 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <span className="font-display font-extrabold text-lg sm:text-2xl text-white block">
                  5+ Years
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-light block leading-tight mt-0.5">
                  of Trusted Service
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Hero Visual */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/80 group"
            >
              <div className="relative aspect-[4/3] sm:aspect-[3/4] w-full bg-deccan-card">
                <Image
                  src="/images/hero_balcony.jpg"
                  alt="Deccan Space Works Modern Balcony Installation in Hyderabad"
                  fill
                  className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                  priority
                />

                {/* Subtle vignette for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-deccan-dark/90 via-transparent to-black/20" />

                {/* Floating Technical Badge Top Right */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-deccan-dark/85 backdrop-blur-md border border-deccan-cyan/40 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg flex items-center gap-1.5 sm:gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-deccan-cyan" />
                  <span className="text-[10px] sm:text-xs font-mono tracking-wider text-white">TESTED &amp; CERTIFIED</span>
                </div>

                {/* Floating Specification Card Bottom */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-deccan-dark/90 backdrop-blur-xl border border-white/15 rounded-xl p-3 sm:p-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-deccan-cyan" />
                      <span className="text-[10px] sm:text-xs font-mono font-medium uppercase tracking-wider text-white">
                        Complete Home Solutions
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-mono text-deccan-cyan px-1.5 sm:px-2 py-0.5 rounded bg-deccan-cyan/10 border border-deccan-cyan/20">
                      Hyderabad
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 sm:pt-3">
                    <div>
                      <span className="text-slate-400 block text-[10px] sm:text-[11px]">Primary Coverage:</span>
                      <span className="text-slate-200 font-medium text-[10px] sm:text-xs">Balconies &amp; Windows</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] sm:text-[11px]">Installations:</span>
                      <span className="text-slate-200 font-medium text-[10px] sm:text-xs">8,000+ Completed</span>
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


