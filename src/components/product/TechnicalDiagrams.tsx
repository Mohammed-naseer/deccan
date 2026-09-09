"use client";

import { useState } from "react";
import Image from "next/image";
import { engineeringDiagrams } from "@/data/productData";
import { Maximize2, Shield, Wrench, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TechnicalDiagrams() {
  const [selectedDiagram, setSelectedDiagram] = useState<string>("channel");

  const active = engineeringDiagrams.find((d) => d.id === selectedDiagram) || engineeringDiagrams[0];

  return (
    <section id="engineering" className="py-24 bg-deccan-card/60 border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            Engineering Schematics
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Technical Diagram & Dimensions
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
            Direct cross-sections and dimension measurements from our official technical documentation for the heavy-duty aluminium channel, multi-strand cable, and stiffener.
          </p>
        </div>

        {/* Tab Navigation for the 3 Diagrams */}
        <div className="flex flex-wrap gap-3 mb-8">
          {engineeringDiagrams.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDiagram(d.id)}
              className={`px-5 py-3 rounded-xl font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                selectedDiagram === d.id
                  ? "bg-deccan-cyan text-deccan-dark font-bold shadow-lg shadow-deccan-cyan/20"
                  : "bg-deccan-dark/80 text-slate-300 border border-white/10 hover:border-deccan-cyan/40"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>{d.title} ({d.dimension})</span>
            </button>
          ))}
        </div>

        {/* Diagram Display Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-deccan-dark border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl"
          >
            {/* Left: Diagram Blueprint Image */}
            <div className="lg:col-span-6 flex items-center justify-center p-6 bg-black/40 rounded-2xl border border-white/10 relative group">
              <div className="relative w-full max-w-md aspect-square rounded-xl overflow-hidden bg-white/5 flex items-center justify-center p-4">
                <Image
                  src={active.image}
                  alt={`${active.title} engineering diagram`}
                  fill
                  className="object-contain p-4 filter contrast-125"
                />
              </div>

              <div className="absolute top-4 left-4 bg-deccan-dark/90 border border-deccan-cyan/40 px-3 py-1 rounded-md text-[11px] font-mono text-deccan-cyan">
                OFFICIAL CAD SCHEMATIC
              </div>
            </div>

            {/* Right: Technical Details & Callouts */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-mono text-deccan-cyan uppercase tracking-widest block mb-1">
                  Component Blueprint
                </span>
                <h3 className="font-display text-3xl font-extrabold text-white">
                  {active.title}
                </h3>
                <div className="inline-block mt-2 px-3 py-1 rounded bg-deccan-cyan/10 border border-deccan-cyan/25 text-deccan-cyan font-mono text-sm font-semibold">
                  Dimension: {active.dimension}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-mono block">
                  Engineering Notes from Documentation:
                </span>
                <ul className="space-y-3">
                  {active.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-200 text-sm font-light">
                      <div className="w-5 h-5 rounded-md bg-deccan-card border border-white/10 flex items-center justify-center text-deccan-cyan flex-shrink-0 mt-0.5">
                        ✓
                      </div>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-deccan-card/60 border border-white/10 text-xs text-slate-400 font-light flex items-center gap-3">
                <Wrench className="w-5 h-5 text-deccan-cyan flex-shrink-0" />
                <span>
                  All channels and cables are precision tension-fitted by certified Deccan Space Works technicians on site in Hyderabad.
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
