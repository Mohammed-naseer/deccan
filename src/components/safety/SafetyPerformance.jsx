"use client";

import Image from "next/image";
import { ShieldCheck, Heart, LifeBuoy } from "lucide-react";
import { motion } from "framer-motion";

export default function SafetyPerformance() {
  return (
    <section className="py-24 bg-deccan-dark relative overflow-hidden">
      {/* Subtle radial cyan background */}
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Authentic Fall Prevention Hand Image */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-deccan-card"
            >
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src="/images/safety_wire_hand.jpg"
                  alt="Child and pet safety fall prevention demonstration with invisible grill wires"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deccan-dark/80 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-deccan-dark/90 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-2 text-deccan-cyan font-mono text-xs uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Company Stated Feature</span>
                  </div>
                  <p className="text-xs text-slate-300 font-light">
                    Smooth nylon melt coat prevents scrapes while maintaining high-tensile resistance against accidental falls.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Safety & Performance Narrative */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
                Safety & Performance
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Strength You Don&apos;t Notice.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-deccan-cyan to-blue-400">
                  Protection You Can Trust.
                </span>
              </h2>
            </div>

            <p className="text-slate-300 text-base sm:text-lg font-light leading-relaxed">
              In modern high-rise apartments and residential villas, safety shouldn&apos;t feel like a cage. Deccan Space Works invisible grills provide structural peace of mind while preserving open skies.
            </p>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-deccan-card/60 border border-white/10 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan flex-shrink-0 mt-1">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    Child and Pet Safe — Prevents Accidental Falls
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-light mt-1">
                    Carefully spaced wire spacing (standard 2 inches / 50 mm) prevents children and household pets from squeezing through or falling from balconies and high-aperture windows.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-deccan-card/60 border border-white/10 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan flex-shrink-0 mt-1">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    High Tensile Strength & Anti-Rust Wires
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-light mt-1">
                    Manufactured with marine grade SS 316 and SS 304 stainless steel cores coated in premier nylon melt coat. Tested strength to withstand up to 400 kg tension load.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-deccan-card/60 border border-white/10 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan flex-shrink-0 mt-1">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    Emergency Escape Consideration
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-light mt-1">
                    Unlike permanent iron grills that seal occupants inside during high-rise fire emergencies, invisible grill cables can be severed quickly with specialized wire cutters by emergency rescue personnel.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
