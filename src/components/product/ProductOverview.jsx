"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Sliders, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductOverview() {
  return (
    <section id="product" className="py-24 bg-deccan-card/50 border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Product Image */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-deccan-card group"
            >
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src="/images/highrise_view.jpg"
                  alt="High-rise apartment balcony fitted with Deccan Space Works invisible grills"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deccan-dark/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 p-5 rounded-xl bg-deccan-dark/85 backdrop-blur-md border border-white/10">
                  <span className="text-xs font-mono text-deccan-cyan uppercase tracking-widest block mb-1">
                    Authentic Specification
                  </span>
                  <p className="text-sm text-slate-200 font-light">
                    Fixed directly to building slab structures or customized aluminium frames in vertical & horizontal orientation.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Editorial Product Explanation from PDF */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
                Product Architecture
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                The Cable Is the Heart of the Product.
              </h2>
            </div>

            {/* Direct text quote from PDF */}
            <div className="p-5 rounded-xl bg-deccan-card border-l-4 border-deccan-cyan text-slate-200 text-base sm:text-lg leading-relaxed font-light">
              &ldquo;The cable is heart of our product which is made using stainless steel that comes with premier nylon melt coat. This product can either be fixed to the building structure or it can also be fixed to customized aluminum frames in both vertical and horizontal form.&rdquo;
            </div>

            {/* Structured Specifications list */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-deccan-cyan" />
                <span>Installation Configurations</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-deccan-dark/70 border border-white/10">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <CheckCircle2 className="w-4 h-4 text-deccan-cyan" />
                    <span>Vertical Form</span>
                  </div>
                  <p className="text-xs text-slate-400 font-light">
                    Recommended for high-rise balconies and full-height window facades to prevent climbability.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-deccan-dark/70 border border-white/10">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <CheckCircle2 className="w-4 h-4 text-deccan-cyan" />
                    <span>Horizontal Form</span>
                  </div>
                  <p className="text-xs text-slate-400 font-light">
                    Ideal for parapet railings, low walls, and architectural banisters with custom aluminium sub-frames.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-deccan-dark/70 border border-white/10">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <Shield className="w-4 h-4 text-deccan-cyan" />
                    <span>Direct Structure Fixing</span>
                  </div>
                  <p className="text-xs text-slate-400 font-light">
                    Anchored solidly into reinforced concrete ceiling and floor slabs with heavy-duty fasteners.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-deccan-dark/70 border border-white/10">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <Shield className="w-4 h-4 text-deccan-cyan" />
                    <span>Custom Aluminium Frames</span>
                  </div>
                  <p className="text-xs text-slate-400 font-light">
                    Tailored frames designed to fit sliding, casement, and bi-fold window profiles perfectly.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="#enquiry"
                className="inline-flex items-center gap-2 text-sm font-semibold text-deccan-cyan hover:text-white transition-colors"
              >
                <span>Request Custom Site Measurement in Hyderabad</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
