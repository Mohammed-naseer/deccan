"use client";

import { whyFeatures } from "@/data/productData";
import { Eye, ShieldCheck, Sparkles, LifeBuoy, Clock, Layers } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  Eye,
  ShieldCheck,
  Sparkles,
  LifeBuoy,
  Clock,
  Layers,
};

export default function WhyInvisibleGrills() {
  return (
    <section id="why-us" className="py-24 bg-deccan-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            Why Invisible Grills
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Protection Without the Visual Bulk
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
            Our invisible grill systems are engineered to provide reliable safety for modern homes while maintaining an unobstructed, open architectural appearance.
          </p>
        </div>

        {/* 6 Feature Cards from PDF */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyFeatures.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || ShieldCheck;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group p-8 rounded-2xl bg-deccan-card/70 border border-white/10 hover:border-deccan-cyan/40 hover:bg-deccan-card transition-all duration-300 relative overflow-hidden"
              >
                {/* Subtle cyan corner glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-deccan-cyan/5 rounded-full blur-2xl group-hover:bg-deccan-cyan/15 transition-all" />

                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-deccan-cyan group-hover:bg-deccan-cyan group-hover:text-deccan-dark transition-all mb-6">
                  <IconComponent className="w-6 h-6" />
                </div>

                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  {feature.tagline}
                </span>

                <h3 className="font-display text-xl font-bold text-white mb-3 group-hover:text-deccan-cyan transition-colors">
                  {feature.title}
                </h3>

                <p className="text-slate-300 text-sm leading-relaxed font-light">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
