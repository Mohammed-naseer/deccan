"use client";

import { motion } from "framer-motion";

export default function BrandStatement() {
  return (
    <section className="relative py-20 bg-deccan-card border-y border-white/10 overflow-hidden">
      {/* Cyan architectural diagonal bar */}
      <div 
        className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-deccan-cyan/15 via-deccan-cyan/5 to-transparent pointer-events-none transform skew-x-12" 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="space-y-4 max-w-4xl mx-auto"
        >
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-deccan-cyan block">
            Deccan Space Works Philosophy
          </span>

          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight uppercase leading-tight">
            &ldquo;WHAT&apos;S VISIBLE ARE SEAMLESS.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-deccan-cyan via-cyan-300 to-sky-400">
              WHAT&apos;S INVISIBLE IS STRENGTH.&rdquo;
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto pt-2 font-light">
            Engineered specifically to dissolve the barrier between your living space and the outdoor horizon, without compromising on high-tensile safety.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
