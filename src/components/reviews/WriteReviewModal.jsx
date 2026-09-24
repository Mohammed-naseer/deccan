"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitReview } from "@/services/api";

const CITIES = [
  "Gachibowli", "Jubilee Hills", "Banjara Hills", "Kondapur", "Madhapur",
  "Hitec City", "Kukatpally", "Manikonda", "Kokapet", "Tellapur",
  "Begumpet", "Secunderabad", "Ameerpet", "Miyapur", "Bachupally",
  "Kompally", "Uppal", "LB Nagar", "Dilsukhnagar", "Mehdipatnam", "Other",
];

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  rating: 0,
  review: "",
  city: "",
};

const INITIAL_ERRORS = {
  name: "",
  email: "",
  phone: "",
  rating: "",
  review: "",
  city: "",
};

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deccan-cyan rounded"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-600 fill-transparent"
            }`}
            aria-hidden="true"
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-slate-400 self-center font-mono">
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

export default function WriteReviewModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [serverError, setServerError] = useState("");
  const firstInputRef = useRef(null);

  // Focus trap and keyboard handler
  useEffect(() => {
    if (!isOpen) return;
    // Focus first input when modal opens
    const timer = setTimeout(() => firstInputRef.current?.focus(), 100);
    // Close on Escape
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const validate = () => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
      valid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
      valid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
    }

    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.replace(/\s|-|\+91/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number.";
      valid = false;
    }

    if (formData.rating === 0) {
      newErrors.rating = "Please select a star rating.";
      valid = false;
    }

    if (!formData.review.trim()) {
      newErrors.review = "Review text is required.";
      valid = false;
    } else if (formData.review.trim().length < 20) {
      newErrors.review = "Review must be at least 20 characters.";
      valid = false;
    } else if (formData.review.trim().length > 1000) {
      newErrors.review = "Review cannot exceed 1000 characters.";
      valid = false;
    }

    if (!formData.city.trim()) {
      newErrors.city = "City / Area is required.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setStatus("submitting");
    try {
      // Structured for future POST /api/reviews connection
      await submitReview({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        rating: formData.rating,
        review: formData.review.trim(),
        city: formData.city.trim(),
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setServerError("Something went wrong. Please try again.");
    }
  };

  const handleClose = () => {
    if (status === "submitting") return;
    setFormData(INITIAL_FORM);
    setErrors(INITIAL_ERRORS);
    setStatus("idle");
    setServerError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="review-modal-title"
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg bg-deccan-card border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-deccan-cyan block mb-0.5">
                Share Your Experience
              </span>
              <h2 id="review-modal-title" className="font-display text-xl font-bold text-white">
                Write a Review
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close review form"
              disabled={status === "submitting"}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 max-h-[75vh] overflow-y-auto">
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl font-bold text-white">Review Submitted!</h3>
                <p className="text-slate-300 text-sm font-light leading-relaxed max-w-sm mx-auto">
                  Thank you for your review. Your review has been submitted successfully.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-deccan-cyan text-deccan-dark font-semibold text-sm hover:bg-cyan-300 transition-all"
                >
                  Close
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Server error */}
                {serverError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="review-name" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="review-name"
                      ref={firstInputRef}
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      aria-required="true"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "review-name-error" : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                    />
                    {errors.name && (
                      <p id="review-name-error" className="mt-1 text-xs text-rose-400" role="alert">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="review-email" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="review-email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="name@example.com"
                      aria-required="true"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "review-email-error" : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                    />
                    {errors.email && (
                      <p id="review-email-error" className="mt-1 text-xs text-rose-400" role="alert">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Phone + City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="review-phone" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Phone <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      id="review-phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+91 98480 00000"
                      aria-describedby={errors.phone ? "review-phone-error" : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                    />
                    {errors.phone && (
                      <p id="review-phone-error" className="mt-1 text-xs text-rose-400" role="alert">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="review-city" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      City / Area <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="review-city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      aria-required="true"
                      aria-invalid={!!errors.city}
                      aria-describedby={errors.city ? "review-city-error" : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                    >
                      <option value="" disabled>Select your area</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c} className="bg-deccan-card">{c}</option>
                      ))}
                    </select>
                    {errors.city && (
                      <p id="review-city-error" className="mt-1 text-xs text-rose-400" role="alert">{errors.city}</p>
                    )}
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                    Rating <span className="text-rose-400">*</span>
                  </label>
                  <StarRating
                    value={formData.rating}
                    onChange={(r) => handleChange("rating", r)}
                  />
                  {errors.rating && (
                    <p className="mt-1 text-xs text-rose-400" role="alert">{errors.rating}</p>
                  )}
                </div>

                {/* Review Text */}
                <div>
                  <label htmlFor="review-text" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Review <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    id="review-text"
                    rows={4}
                    value={formData.review}
                    onChange={(e) => handleChange("review", e.target.value)}
                    placeholder="Share your experience with Deccan Space Works — installation quality, team, service..."
                    aria-required="true"
                    aria-invalid={!!errors.review}
                    aria-describedby="review-text-count"
                    className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.review ? (
                      <p className="text-xs text-rose-400" role="alert">{errors.review}</p>
                    ) : (
                      <span />
                    )}
                    <span
                      id="review-text-count"
                      className={`text-[11px] font-mono ${
                        formData.review.length > 950 ? "text-rose-400" : "text-slate-500"
                      }`}
                    >
                      {formData.review.length}/1000
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl border border-white/15 text-slate-300 hover:text-white hover:border-white/30 text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="flex-1 py-3 rounded-xl bg-deccan-cyan text-deccan-dark font-semibold text-sm hover:bg-cyan-300 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Review</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
