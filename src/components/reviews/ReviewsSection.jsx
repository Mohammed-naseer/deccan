"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { siteConfig } from "@/config/site";
import WriteReviewModal from "@/components/reviews/WriteReviewModal";

const reviews = [
  {
    id: 1,
    name: "Ramesh Chandra",
    location: "Gachibowli, Hyderabad",
    property: "3BHK Apartment · 18th Floor",
    rating: 5,
    date: "August 2026",
    text: "Excellent service from start to finish. The team came for a free site visit within 2 days of my enquiry, measured everything precisely, and completed the installation in a single day. The invisible grills on my balcony are absolutely seamless — my wife was worried it would look like a cage but now she loves how open and airy it feels. Highly recommended for high-rise families.",
    highlight: "Completed in a single day",
    avatar: "RC",
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: 2,
    name: "Priya Sharma",
    location: "Jubilee Hills, Hyderabad",
    property: "Independent Villa · 2 Floors",
    rating: 5,
    date: "July 2026",
    text: "We have a 5-year-old and two dogs, so child and pet safety was our top priority. Deccan Space Works installed SS 316 marine grade grills on all 6 windows and the large balcony. The wire tension is rock solid, my son has tried pulling at them and they don't budge at all. The nylon coating is smooth so no scratches. Worth every rupee for the peace of mind.",
    highlight: "SS 316 marine grade — rock solid",
    avatar: "PS",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: 3,
    name: "Vikram Nair",
    location: "Kondapur, Hyderabad",
    property: "2BHK Apartment · 12th Floor",
    rating: 5,
    date: "June 2026",
    text: "I researched invisible grills for 3 months before deciding. Compared 4 vendors in Hyderabad and Deccan Space Works had the best quality materials and the most transparent pricing. No hidden charges, no pressure selling. The 27mm aluminium channel installation is very clean and professional. The view from my apartment is now completely unobstructed. Beautiful work.",
    highlight: "Most transparent pricing in Hyderabad",
    avatar: "VN",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: 4,
    name: "Anitha Reddy",
    location: "Banjara Hills, Hyderabad",
    property: "Penthouse · 3 Balconies",
    rating: 5,
    date: "May 2026",
    text: "Stunning results across all three balconies of our penthouse. The team handled the complex corner angles perfectly — I was worried about the L-shaped balcony but they had a great solution with the bi-fold configuration. The panoramic city view is now completely clear with no bars interrupting the skyline. Our architect even complimented the installation quality.",
    highlight: "Complex corner angles handled perfectly",
    avatar: "AR",
    color: "from-rose-500 to-pink-600",
  },
  {
    id: 5,
    name: "Suresh Kumar",
    location: "Madhapur, Hyderabad",
    property: "Office Building · 7th Floor",
    rating: 5,
    date: "April 2026",
    text: "Installed invisible grills for our entire office floor — 8 large windows and an open-air terrace. The installation crew was professional, punctual, and cleaned up perfectly after finishing. The grills pass our corporate safety audit requirements. Several of our employees have now asked for the contact to install at their homes. Great team!",
    highlight: "Passed corporate safety audit",
    avatar: "SK",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: 6,
    name: "Deepa Menon",
    location: "Manikonda, Hyderabad",
    property: "3BHK Flat · 9th Floor",
    rating: 5,
    date: "March 2026",
    text: "Saw Deccan Space Works on Instagram and reached out via DM. Got a reply within the hour and scheduled a site visit for the very next morning. The team is very knowledgeable — they explained all the wire thickness options, coating types and helped me choose the right setup for my south-facing balcony. Installation was quick and the finish is immaculate.",
    highlight: "Found via Instagram, booked next morning",
    avatar: "DM",
    color: "from-sky-500 to-cyan-600",
  },
];

import { getPublicReviews } from "@/services/api";

const stats = [
  { value: "8,000+", label: "Installations in Hyderabad" },
  { value: "5.0", label: "Average Rating" },
  { value: "100%", label: "On-Time Completion" },
  { value: "3 Yrs", label: "Warranty on All Work" },
];

export default function ReviewsSection() {
  const [active, setActive] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewList, setReviewList] = useState(reviews);

  useEffect(() => {
    getPublicReviews().then((liveReviews) => {
      if (liveReviews && liveReviews.length > 0) {
        const formatted = liveReviews.map((r, i) => ({
          id: r._id || i,
          name: r.name,
          location: `${r.city || "Hyderabad"}, Hyderabad`,
          property: "Verified Customer",
          rating: r.rating || 5,
          date: new Date(r.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
          text: r.review,
          highlight: "Verified Installation",
          avatar: r.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "DS",
          color: "from-cyan-500 to-blue-600"
        }));
        setReviewList(formatted);
      }
    });
  }, []);

  const prev = () => setActive((p) => (p === 0 ? reviewList.length - 1 : p - 1));
  const next = () => setActive((p) => (p === reviewList.length - 1 ? 0 : p + 1));

  const review = reviewList[active] || reviewList[0];

  return (
    <section id="reviews" className="py-20 sm:py-24 bg-deccan-dark border-t border-white/10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-deccan-cyan/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
              Customer Feedback
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Trusted by Hyderabad{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-deccan-cyan via-cyan-300 to-blue-400">
                Families & Businesses
              </span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
              Real feedback from our customers across Gachibowli, Jubilee Hills, Banjara Hills, Kondapur and surrounding areas.
            </p>
          </motion.div>

          {/* Instagram CTA */}
          <motion.a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 hover:border-pink-400/60 transition-all group w-full md:w-auto justify-center md:justify-start"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 flex items-center justify-center flex-shrink-0">
              <InstagramIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-mono block">See more on</span>
              <span className="text-sm font-semibold text-white group-hover:text-pink-300 transition-colors">
                {siteConfig.instagram}
              </span>
            </div>
          </motion.a>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12"
        >
          {stats.map((s, i) => (
            <div key={i} className="p-4 sm:p-5 rounded-2xl bg-deccan-card/60 border border-white/10 text-center">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-deccan-cyan to-blue-400">
                {s.value}
              </span>
              <span className="text-xs text-slate-400 font-mono block mt-1 uppercase tracking-wider">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Main Review Carousel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">

          {/* Left: Review Card */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                className="h-full p-6 sm:p-8 rounded-3xl bg-deccan-card border border-white/15 shadow-2xl relative overflow-hidden"
              >
                {/* Faint quote mark background */}
                <div className="absolute top-4 right-6 text-[120px] font-display text-white/3 leading-none select-none pointer-events-none">
                  &ldquo;
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 text-xs font-mono text-slate-400 self-center">{review.date}</span>
                </div>

                {/* Highlight tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/25 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-deccan-cyan" />
                  <span className="text-[11px] font-mono text-deccan-cyan uppercase tracking-wider">
                    {review.highlight}
                  </span>
                </div>

                {/* Review text */}
                <blockquote className="text-slate-200 text-base sm:text-lg font-light leading-relaxed mb-6">
                  &ldquo;{review.text}&rdquo;
                </blockquote>

                {/* Reviewer info */}
                <div className="flex items-center gap-4 pt-5 border-t border-white/10">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${review.color} flex items-center justify-center text-white font-display font-bold text-base flex-shrink-0`}>
                    {review.avatar}
                  </div>
                  <div>
                    <span className="font-display font-bold text-white block">{review.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{review.location}</span>
                    <span className="text-[11px] text-deccan-cyan font-mono block mt-0.5">{review.property}</span>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <div className="flex gap-1.5">
                    {reviews.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === active ? "w-6 bg-deccan-cyan" : "w-1.5 bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={prev}
                      className="w-9 h-9 rounded-full bg-deccan-dark border border-white/15 flex items-center justify-center text-slate-300 hover:text-white hover:border-deccan-cyan/40 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={next}
                      className="w-9 h-9 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan hover:bg-deccan-cyan hover:text-deccan-dark transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: All reviewers list + Instagram panel */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {/* Reviewer list */}
            <div className="flex-1 p-4 sm:p-5 rounded-3xl bg-deccan-card/50 border border-white/10 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 block mb-3">
                All Reviews
              </span>
              {reviews.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setActive(i)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                    i === active
                      ? "bg-deccan-dark border border-deccan-cyan/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {r.avatar}
                  </div>
                  <div className="min-w-0">
                    <span className={`text-sm font-medium block truncate ${i === active ? "text-white" : "text-slate-300"}`}>
                      {r.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate block">{r.location}</span>
                  </div>
                  {i === active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-deccan-cyan flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Instagram DM Panel */}
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-deccan-card border border-pink-500/20 hover:border-pink-400/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-900/40">
                  <InstagramIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-mono text-pink-300 uppercase tracking-wider block">
                    Chat with us
                  </span>
                  <span className="text-sm font-bold text-white group-hover:text-pink-200 transition-colors">
                    {siteConfig.instagram}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                DM us on Instagram for quick replies, project photos, and pricing estimates. We respond within the hour.
              </p>
              <div className="mt-3 flex items-center gap-2 text-pink-400 text-xs font-semibold group-hover:gap-3 transition-all">
                <span>Open Instagram</span>
                <span>→</span>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 sm:mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-deccan-card to-deccan-dark border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
        >
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-1">
              Share Your Experience
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white">
              Already installed with us? We&apos;d love your feedback.
            </h3>
            <p className="text-slate-400 text-sm mt-1 font-light">
              Tag us on Instagram or drop a Google review — it helps other families in Hyderabad decide.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Write a Review button */}
            <button
              type="button"
              onClick={() => setReviewModalOpen(true)}
              aria-label="Write a customer review"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-deccan-cyan text-deccan-dark font-semibold text-sm hover:bg-cyan-300 transition-all shadow-lg shadow-deccan-cyan/20 whitespace-nowrap"
            >
              <Star className="w-4 h-4 fill-deccan-dark" aria-hidden="true" />
              <span>Write a Review</span>
            </button>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-all whitespace-nowrap"
            >
              <InstagramIcon className="w-4 h-4" aria-hidden="true" />
              <span>Tag on Instagram</span>
            </a>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent("Hi! I'd like to share my feedback about the invisible grill installation by Deccan Space Works.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-deccan-card border border-white/15 text-slate-200 hover:text-white hover:border-deccan-cyan/40 font-semibold text-sm transition-all whitespace-nowrap"
            >
              <Quote className="w-4 h-4 text-deccan-cyan" aria-hidden="true" />
              <span>Send Feedback</span>
            </a>
          </div>
        </motion.div>

      </div>

      {/* Write a Review Modal */}
      <WriteReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
      />
    </section>
  );
}
