"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { galleryItems as defaultGalleryItems } from "@/data/productData";
import { getGallery } from "@/services/api";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["All", "Balconies", "Windows", "Installation", "Details"];

export default function VisualGallery() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [galleryList, setGalleryList] = useState(defaultGalleryItems);
  const lightboxRef = useRef(null);
  const lastFocusedTriggerRef = useRef(null);

  useEffect(() => {
    getGallery().then((liveItems) => {
      if (liveItems && liveItems.length > 0) {
        const formatted = liveItems.map((item, idx) => ({
          id: item._id || item.id || `gal-${idx}`,
          image: item.imageUrl || item.image || "/images/hero_balcony.jpg",
          title: item.title || "Invisible Grill Installation",
          caption: item.description || item.caption || "",
          category: item.category || "Balconies",
        }));
        setGalleryList(formatted);
      }
    });
  }, []);

  const filteredItems =
    selectedCategory === "All"
      ? galleryList
      : galleryList.filter((item) => item.category === selectedCategory);

  // Keyboard navigation & focus trap for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    // Focus close button initially
    const timer = setTimeout(() => {
      const closeBtn = lightboxRef.current?.querySelector('button[aria-label="Close lightbox"]');
      closeBtn?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
        return;
      }
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % filteredItems.length : null
        );
        return;
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null
            ? (prev - 1 + filteredItems.length) % filteredItems.length
            : null
        );
        return;
      }

      // Tab trap
      if (e.key === "Tab" && lightboxRef.current) {
        const focusable = lightboxRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (lastFocusedTriggerRef.current && typeof lastFocusedTriggerRef.current.focus === "function") {
        lastFocusedTriggerRef.current.focus();
      }
    };
  }, [lightboxIndex, filteredItems.length]);

  const activeLightboxItem =
    lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <section id="gallery" className="py-24 bg-deccan-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            Visual Portfolio
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Product & Installation Gallery
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
            Examine authentic invisible grill installations, window configurations, wire tension details, and heavy-duty 27 mm aluminium tracks.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setLightboxIndex(null);
              }}
              className={`px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                selectedCategory === cat
                  ? "bg-deccan-cyan text-deccan-dark font-bold shadow-lg shadow-deccan-cyan/20 border border-deccan-cyan"
                  : "bg-deccan-card text-slate-300 border border-white/10 hover:border-deccan-cyan/40 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry / Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              tabIndex={0}
              role="button"
              aria-label={`View ${item.title}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  lastFocusedTriggerRef.current = document.activeElement;
                  setLightboxIndex(index);
                }
              }}
              onClick={() => {
                lastFocusedTriggerRef.current = document.activeElement;
                setLightboxIndex(index);
              }}
              className="architectural-card group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:border-deccan-cyan/50 focus:outline-none focus:border-deccan-cyan transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={item.image || item.imageUrl || "/images/hero_balcony.jpg"}
                  alt={item.title || "Invisible grill installation in Hyderabad"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deccan-dark/90 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                {/* Hover overlay icon */}
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-deccan-dark/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                  <Maximize2 className="w-4 h-4 text-deccan-cyan" />
                </div>

                {/* Caption bottom */}
                <div className="absolute bottom-4 left-4 right-4 space-y-1">
                  <span className="text-[10px] font-mono text-deccan-cyan uppercase tracking-widest block">
                    {item.category}
                  </span>
                  <h3 className="font-display font-bold text-sm sm:text-base text-white line-clamp-1 group-hover:text-deccan-cyan transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-light line-clamp-1">
                    {item.caption || item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxItem && lightboxIndex !== null && (
          <motion.div
            ref={lightboxRef}
            role="dialog"
            aria-modal="true"
            aria-label="Image gallery lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Left Nav */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (lightboxIndex - 1 + filteredItems.length) % filteredItems.length
                );
              }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right Nav */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
              }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Main Lightbox Content */}
            <div className="relative max-w-4xl w-full max-h-[75vh] aspect-[16/10] rounded-2xl overflow-hidden border border-white/20 bg-deccan-card">
              <Image
                src={activeLightboxItem.image || activeLightboxItem.imageUrl || "/images/hero_balcony.jpg"}
                alt={activeLightboxItem.title || "Invisible grill installation in Hyderabad"}
                fill
                sizes="(max-width: 1024px) 95vw, 896px"
                className="object-contain"
              />
            </div>

            {/* Caption & Counter */}
            <div className="text-center mt-6 max-w-xl space-y-2">
              <div className="text-xs font-mono text-deccan-cyan uppercase tracking-widest">
                {activeLightboxItem.category} · Image {lightboxIndex + 1} of{" "}
                {filteredItems.length}
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                {activeLightboxItem.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-light">
                {activeLightboxItem.caption || activeLightboxItem.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
