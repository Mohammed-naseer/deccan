"use client";

import Link from "next/link";
import { MapPin, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const hyderabadAreas = [
  "Gachibowli",
  "Madhapur",
  "Kondapur",
  "Manikonda",
  "Jubilee Hills",
  "Banjara Hills",
  "Hitech City",
  "Kukatpally",
  "Ameerpet",
  "Secunderabad",
  "Kokapet",
  "Financial District",
  "Tellapur",
  "Nallagandla",
  "Miyapur",
  "All Areas in Hyderabad",
];

export default function ServiceAreasSection() {
  return (
    <section className="py-20 bg-deccan-dark border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            OUR SERVICE AREAS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Serving All Over Hyderabad
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 font-light leading-relaxed">
            From apartments to villas, we bring safety and style to every home across Greater Hyderabad.
          </p>
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {hyderabadAreas.map((area, index) => (
            <motion.div
              key={area}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="flex items-center gap-2.5 p-3.5 rounded-xl bg-deccan-card/70 border border-white/10 hover:border-deccan-cyan/40 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/25 flex items-center justify-center text-deccan-cyan flex-shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                {area}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Quick prompt banner */}
        <div className="p-6 rounded-2xl bg-deccan-card/60 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-deccan-cyan flex-shrink-0" />
            <p className="text-xs sm:text-sm text-slate-300 font-light">
              Not sure if your specific locality is covered? We service all Hyderabad pincodes with free on-site measurement.
            </p>
          </div>
          <Link
            href="#enquiry"
            className="px-5 py-2.5 rounded-xl bg-deccan-cyan text-deccan-dark font-semibold text-xs sm:text-sm hover:bg-cyan-300 transition-all whitespace-nowrap"
          >
            Check My Area
          </Link>
        </div>

      </div>
    </section>
  );
}
