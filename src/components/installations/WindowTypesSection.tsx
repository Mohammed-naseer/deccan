"use client";

import { useState } from "react";
import Image from "next/image";
import { windowInstallationTypes } from "@/data/productData";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WindowTypesSection() {
  const [activeType, setActiveType] = useState<string>("fixed");

  const current =
    windowInstallationTypes.find((t) => t.id === activeType) ||
    windowInstallationTypes[0];

  return (
    <section id="window-types" className="py-24 bg-deccan-card/40 border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            Installation Versatility
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Designed for Different Window Configurations
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
            As documented in our technical guide, Deccan Space Works invisible grills adapt seamlessly to all four principal window architectural types.
          </p>
        </div>

        {/* 4 Interactive Type Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {windowInstallationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`p-5 rounded-2xl text-left transition-all relative overflow-hidden border ${
                activeType === type.id
                  ? "bg-deccan-card border-deccan-cyan shadow-xl shadow-deccan-cyan/10"
                  : "bg-deccan-dark/80 border-white/10 hover:border-white/20 text-slate-400"
              }`}
            >
              <span className={`text-[11px] font-mono uppercase tracking-wider block mb-1 ${
                activeType === type.id ? "text-deccan-cyan" : "text-slate-400"
              }`}>
                Type {windowInstallationTypes.indexOf(type) + 1}
              </span>
              <h3 className={`font-display font-bold text-base sm:text-lg ${
                activeType === type.id ? "text-white" : "text-slate-300"
              }`}>
                {type.name}
              </h3>
            </button>
          ))}
        </div>

        {/* Active Window Type Showcase Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-deccan-dark border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl"
          >
            {/* Left: Window Installation Photo */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/10 bg-deccan-card aspect-[4/3] w-full">
              <Image
                src={current.image}
                alt={`${current.name} installation for invisible grills`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deccan-dark/60 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 bg-deccan-dark/90 border border-deccan-cyan/40 px-3 py-1 rounded text-xs font-mono text-deccan-cyan">
                {current.name} · Real Installation
              </div>
            </div>

            {/* Right: Detailed Specification Breakdown */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-mono text-deccan-cyan uppercase tracking-widest block mb-1">
                  Architecture & Function
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                  {current.headline}
                </h3>
              </div>

              <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed">
                {current.description}
              </p>

              <div className="p-4 rounded-xl bg-deccan-card/70 border border-white/10 space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Installation Configuration:
                </span>
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                  <CheckCircle2 className="w-4 h-4 text-deccan-cyan" />
                  <span>{current.configuration}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-light">
                <span>Custom fabrication available for UPVC, aluminium and wood framing.</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
