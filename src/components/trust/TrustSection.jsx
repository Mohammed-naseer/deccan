"use client";

import { Award, Users, Clock, ThumbsUp } from "lucide-react";
import { motion } from "framer-motion";

const trustPillars = [
  {
    icon: Award,
    title: "Premium Quality Materials",
    description:
      "Engineered with marine grade stainless steel (SS 316 & SS 304), high-grade aluminium channels, and durable protective coatings.",
  },
  {
    icon: Users,
    title: "Experienced & Professional Team",
    description:
      "Trained technicians specialized in laser-accurate measurement, precision tensioning, and secure structural anchoring.",
  },
  {
    icon: Clock,
    title: "On-Time Service",
    description:
      "Prompt response times, quick site visits across Hyderabad, and seamless single-day execution for most residential projects.",
  },
  {
    icon: ThumbsUp,
    title: "Customer Satisfaction First",
    description:
      "Over 8,000 satisfied homeowners across Hyderabad trust our safety, cleanliness, and long-term service support.",
  },
];

export default function TrustSection() {
  return (
    <section className="py-20 bg-deccan-card/60 border-y border-white/10 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-deccan-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            WHY CHOOSE DECCAN SPACE WORKS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built on Trust, Safety &amp; Excellence
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 font-light leading-relaxed">
            Delivering dependable space management and architectural protection for modern living in Hyderabad.
          </p>
        </div>

        {/* 4 Trust Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-deccan-dark/80 border border-white/10 hover:border-deccan-cyan/40 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/25 flex items-center justify-center text-deccan-cyan group-hover:bg-deccan-cyan group-hover:text-deccan-dark transition-all mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2 group-hover:text-deccan-cyan transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
