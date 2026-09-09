"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2, Home, Landmark } from "lucide-react";
import { motion } from "framer-motion";

const applications = [
  {
    title: "High-Rise Balconies",
    subtitle: "Skyline Views with 400kg Tension Safety",
    description: "Designed for premium apartments and towers across Hyderabad (Gachibowli, Financial District, Hitec City) preserving expansive outdoor horizons.",
    image: "/images/hero_balcony.jpg",
    tag: "High-Rise",
  },
  {
    title: "Minimalist Residences & Villas",
    subtitle: "Architectural Cleanliness",
    description: "Clean SS 316 wire lines that integrate into luxury residential architecture without the aesthetic penalty of heavy wrought iron.",
    image: "/images/modern_residence.jpg",
    tag: "Villas",
  },
  {
    title: "Bedroom & Living Windows",
    subtitle: "Unobstructed Natural Sunlight",
    description: "Fixed and sliding window invisible grills that welcome unfiltered natural light and airflow while preventing accidental falls.",
    image: "/images/window_interior.jpg",
    tag: "Windows",
  },
  {
    title: "Terraces & Deck Railings",
    subtitle: "Transparent Perimeter Protection",
    description: "Frameless look blending harmoniously with glass railings, outdoor decks, and open rooftop sit-outs.",
    image: "/images/terrace_panoramic.jpg",
    tag: "Terraces",
  },
];

export default function ApplicationsSection() {
  return (
    <section id="applications" className="py-24 bg-deccan-card/40 border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
              Visual Applications
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Safety Preserving the Openness of Space
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
              Explore how invisible grill systems seamlessly integrate into balconies, modern apartments, high-rises, and residential spaces.
            </p>
          </div>

          <Link
            href="#enquiry"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-deccan-cyan text-deccan-dark px-6 py-3 rounded-full hover:bg-cyan-300 transition-all shadow-lg"
          >
            <span>Book Site Measurement</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Architectural Application Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {applications.map((app, index) => (
            <motion.div
              key={app.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative rounded-3xl overflow-hidden border border-white/15 bg-deccan-card shadow-xl"
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={app.image}
                  alt={app.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deccan-dark via-deccan-dark/40 to-transparent" />

                {/* Floating Tag */}
                <div className="absolute top-4 left-4 bg-deccan-dark/85 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[11px] font-mono text-deccan-cyan">
                  {app.tag}
                </div>

                {/* Card Content Overlay Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-deccan-cyan">
                    {app.subtitle}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-white group-hover:text-deccan-cyan transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-slate-300 text-sm font-light leading-relaxed max-w-lg">
                    {app.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
