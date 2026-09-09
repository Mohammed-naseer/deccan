"use client";

import { technicalSpecs, wireOptions } from "@/data/productData";
import { ShieldCheck, Anchor, Wrench, Eye, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "framer-motion";

export default function TechnicalSpecifications() {
  return (
    <section id="specifications" className="py-24 bg-deccan-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            Engineering & Materials
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Engineered for Strength.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
            All specifications presented are authentic parameters from our engineering documentation, crafted for marine durability, structural integrity, and architectural purity.
          </p>
        </div>

        {/* Wire Options Comparison Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {wireOptions.map((opt, i) => (
            <motion.div
              key={opt.thickness}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-gradient-to-b from-deccan-card to-deccan-dark border border-white/10 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan">
                  Wire Thickness Option {i + 1}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white">
                  SS 316 / 304 Grade
                </span>
              </div>

              <div className="font-display text-4xl font-extrabold text-white mb-2">
                {opt.thickness}
              </div>
              <div className="text-sm font-medium text-deccan-cyan mb-3">
                {opt.material}
              </div>
              <p className="text-slate-300 text-sm font-light leading-relaxed">
                {opt.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* 6 Technical Specification Cards Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicalSpecs.map((spec, index) => (
            <motion.div
              key={spec.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="p-6 rounded-2xl bg-deccan-card/60 border border-white/10 hover:border-deccan-cyan/40 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                  {spec.category}
                </span>
                <h3 className="font-display text-xl font-bold text-white mb-4">
                  {spec.value}
                </h3>
                <ul className="space-y-2">
                  {spec.details.map((detail, idx) => (
                    <li key={idx} className="text-xs text-slate-300 font-light flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-deccan-cyan mt-1.5 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {spec.category.includes("Weight") && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 italic block">
                    *Tested strength to withstand up to 400kg tension load as stated in Deccan Space Works technical documentation.
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
