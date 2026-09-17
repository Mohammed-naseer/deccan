"use client";

import { comparisonData } from "@/data/productData";
import { Check, X, ShieldAlert, Sparkles } from "lucide-react";

export default function ComparisonSection() {
  return (
    <section id="comparison" className="py-24 bg-deccan-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            Direct Product Comparison
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Invisible Grills vs Traditional Grills
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
            Based strictly on the six comparative categories documented in our official guide: Unblocked View, Safety, Anti-Rust, Emergency Escape, Fast Installation, and Aesthetics.
          </p>
        </div>

        {/* Comparison Table for Desktop / Tablet */}
        <div className="hidden md:block overflow-hidden rounded-3xl border border-white/15 bg-deccan-card/60 shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-deccan-dark/80">
                <th className="p-6 text-sm font-mono uppercase tracking-wider text-slate-400 w-1/3">
                  Key Evaluation Feature
                </th>
                <th className="p-6 text-sm font-mono uppercase tracking-wider text-deccan-cyan bg-deccan-cyan/5 border-x border-deccan-cyan/20 w-1/3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-deccan-cyan" />
                    <span className="font-bold">Invisible Grille</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-deccan-cyan/20 text-deccan-cyan">
                      Deccan Space Works
                    </span>
                  </div>
                </th>
                <th className="p-6 text-sm font-mono uppercase tracking-wider text-slate-400 w-1/3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-slate-500" />
                    <span>Traditional Iron / MS Grille</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {comparisonData.map((row) => (
                <tr
                  key={row.feature}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-6 font-display font-bold text-white text-base">
                    {row.feature}
                  </td>
                  
                  {/* Invisible Grill Column */}
                  <td className="p-6 bg-deccan-cyan/[0.03] border-x border-deccan-cyan/20">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-white text-sm block">
                          Supported
                        </span>
                        <span className="text-xs text-slate-300 font-light mt-0.5 block">
                          {row.invisibleNote}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Traditional Grill Column */}
                  <td className="p-6">
                    <div className="flex items-start gap-3">
                      {row.traditionalGrille ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
                          <X className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className={`font-semibold text-sm block ${
                          row.traditionalGrille ? "text-slate-200" : "text-rose-400"
                        }`}>
                          {row.traditionalGrille ? "Partial / Rigid" : "Not Provided"}
                        </span>
                        <span className="text-xs text-slate-400 font-light mt-0.5 block">
                          {row.traditionalNote}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Comparison Cards */}
        <div className="md:hidden space-y-4">
          {comparisonData.map((row) => (
            <div
              key={row.feature}
              className="p-5 rounded-2xl bg-deccan-card border border-white/10 space-y-4"
            >
              <h3 className="font-display font-bold text-lg text-white border-b border-white/10 pb-2">
                {row.feature}
              </h3>

              {/* Invisible Grill */}
              <div className="p-3.5 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-deccan-cyan uppercase tracking-wider block">
                    Invisible Grille (Deccan Space Works)
                  </span>
                  <p className="text-xs text-slate-200 font-light mt-1">
                    {row.invisibleNote}
                  </p>
                </div>
              </div>

              {/* Traditional Grill */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  row.traditionalGrille
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                    : "bg-rose-500/20 border border-rose-500/40 text-rose-400"
                }`}>
                  {row.traditionalGrille ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">
                    Traditional Iron Grille
                  </span>
                  <p className="text-xs text-slate-400 font-light mt-1">
                    {row.traditionalNote}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
