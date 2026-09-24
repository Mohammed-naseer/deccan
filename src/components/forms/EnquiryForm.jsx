"use client";

import { useState, useRef } from "react";
import { siteConfig } from "@/config/site";
import { submitSiteVisit } from "@/services/api";
import {
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Upload,
  ShieldCheck,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const propertyTypes = [
  "Apartment",
  "Villa",
  "Independent House",
  "Office",
  "Commercial",
  "Other",
];

const windowTypes = [
  "Fixed Window",
  "Sliding Window",
  "Bi-Fold Window",
  "Casement Window",
  "Balcony",
  "Not Sure",
];

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILES = 5;

const INITIAL_FORM = {
  name: "",
  phoneNumber: "",
  whatsappNumber: "",
  email: "",
  cityArea: "",
  propertyType: "Apartment",
  windowType: "Balcony",
  approximateWindows: "",
  preferredVisitDate: "",
  preferredTime: "Morning (10 AM - 1 PM)",
  requirementDetails: "",
};

// Returns today's date as YYYY-MM-DD for the date input min attribute
function getTodayDateString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function EnquiryForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [imageFiles, setImageFiles] = useState([]); // Array of { file, preview, name }
  const [imageErrors, setImageErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [assignedId, setAssignedId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  // Validate phone number (Indian 10-digit)
  const isValidPhone = (phone) => {
    const cleaned = phone.replace(/\s|-|\+91/g, "");
    return /^[6-9]\d{9}$/.test(cleaned);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const errors = [];
    const valid = [];

    for (const file of selected) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Only JPG, PNG, WEBP images are accepted.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`${file.name}: File size must be under ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }
      if (imageFiles.length + valid.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} images allowed.`);
        break;
      }
      const preview = URL.createObjectURL(file);
      valid.push({ file, preview, name: file.name });
    }

    setImageErrors(errors);
    if (valid.length > 0) {
      setImageFiles((prev) => [...prev, ...valid]);
    }

    // Reset input so the same file can be re-selected after removal
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx) => {
    setImageFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
    setImageErrors([]);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required.";
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    } else if (!isValidPhone(formData.phoneNumber)) {
      errors.phoneNumber = "Enter a valid 10-digit Indian mobile number.";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!formData.cityArea.trim()) errors.cityArea = "City / Area is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Build FormData — ready for multipart POST /api/site-visits
      const payload = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        payload.append(key, val);
      });
      imageFiles.forEach(({ file }) => {
        payload.append("images", file);
      });

      const res = await submitSiteVisit(payload);
      if (res.success) {
        setIsSuccess(true);
        setAssignedId(res.id);
      } else {
        setErrorMsg("Submission failed. Please contact us via phone or WhatsApp.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please call us directly or chat on WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <section id="enquiry" className="py-24 bg-deccan-card/60 border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* Left Column: Context & WhatsApp Quick Action */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
                Free Site Measurement &amp; Consultation
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Want Invisible Grills for Your Home?
              </h2>
              <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
                Tell us about your space and request a site visit. Our experienced Hyderabad field engineers provide custom structural measurement and exact requirement planning.
              </p>
            </div>

            {/* Value Checkpoints */}
            <div className="space-y-4 pt-2">
              {[
                {
                  title: "Structural On-Site Inspection",
                  desc: "Evaluation of window reveal depth, concrete slab integrity, or aluminium framing needs.",
                },
                {
                  title: "Material Specification Guidance",
                  desc: "Direct advice on 2.5 mm vs 3.0 mm wire thickness and SS 316 vs SS 304 stainless steel.",
                },
                {
                  title: "Hyderabad Service Area Coverage",
                  desc: "Prompt scheduling across Gachibowli, Jubilee Hills, Banjara Hills, Kondapur, Madhapur, Kukatpally, and all surrounding localities.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-400 font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Alternative */}
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 space-y-3">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
                Instant Chat Alternative
              </span>
              <p className="text-xs text-slate-300 font-light">
                Prefer instant messaging? Chat with our Hyderabad team on WhatsApp right now with your balcony dimensions or window photos.
              </p>
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                  "Hello Deccan Space Works! I would like to enquire about Invisible Grills for my property in Hyderabad."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg"
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7">
            <div className="p-5 sm:p-8 md:p-10 rounded-3xl bg-deccan-dark border border-white/15 shadow-2xl relative">

              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-6"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-deccan-cyan uppercase tracking-widest block mb-1">
                      Request Confirmed
                    </span>
                    <h3 className="font-display text-2xl font-bold text-white">
                      Free Site Visit Requested!
                    </h3>
                    <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto font-light">
                      Thank you, <span className="font-semibold text-white">{formData.name}</span>.{" "}
                      Your enquiry reference number is:
                    </p>
                    <div className="inline-block mt-3 px-4 py-2 rounded-lg bg-deccan-card border border-deccan-cyan/40 text-deccan-cyan font-mono text-base font-bold">
                      {assignedId}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto font-light">
                    Our technical surveyor will contact you at{" "}
                    <span className="text-white">{formData.phoneNumber}</span> to confirm the
                    appointment date and time slot.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href="/customer/dashboard"
                      className="px-6 py-3 rounded-xl bg-deccan-cyan text-deccan-dark font-semibold text-sm hover:bg-cyan-300 transition-all"
                    >
                      View Live Tracking Demo
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSuccess(false);
                        setFormData(INITIAL_FORM);
                        setImageFiles([]);
                        setAssignedId("");
                      }}
                      className="px-6 py-3 rounded-xl bg-deccan-card border border-white/15 text-slate-300 hover:text-white text-sm transition-colors"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6" aria-label="Free site visit request form">
                  {errorMsg && (
                    <div
                      role="alert"
                      className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Row 1: Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="sv-name" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="sv-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        placeholder="e.g. Ramesh Chandra"
                        aria-required="true"
                        aria-describedby={fieldErrors.name ? "sv-name-error" : undefined}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                      {fieldErrors.name && (
                        <p id="sv-name-error" className="mt-1 text-xs text-rose-400" role="alert">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="sv-phone" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Phone Number <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="sv-phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                        placeholder="+91 98480 00000"
                        aria-required="true"
                        aria-describedby={fieldErrors.phoneNumber ? "sv-phone-error" : undefined}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                      {fieldErrors.phoneNumber && (
                        <p id="sv-phone-error" className="mt-1 text-xs text-rose-400" role="alert">{fieldErrors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: WhatsApp & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="sv-whatsapp" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        WhatsApp Number
                      </label>
                      <input
                        id="sv-whatsapp"
                        type="tel"
                        autoComplete="tel"
                        value={formData.whatsappNumber}
                        onChange={(e) => handleFieldChange("whatsappNumber", e.target.value)}
                        placeholder="Same as phone or alternate"
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="sv-email" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Email Address
                      </label>
                      <input
                        id="sv-email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        placeholder="name@example.com"
                        aria-describedby={fieldErrors.email ? "sv-email-error" : undefined}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                      {fieldErrors.email && (
                        <p id="sv-email-error" className="mt-1 text-xs text-rose-400" role="alert">{fieldErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: City & Property Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="sv-city" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        City / Area (Hyderabad) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="sv-city"
                        type="text"
                        required
                        value={formData.cityArea}
                        onChange={(e) => handleFieldChange("cityArea", e.target.value)}
                        placeholder="e.g. Gachibowli, Jubilee Hills"
                        aria-required="true"
                        aria-describedby={fieldErrors.cityArea ? "sv-city-error" : undefined}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                      {fieldErrors.cityArea && (
                        <p id="sv-city-error" className="mt-1 text-xs text-rose-400" role="alert">{fieldErrors.cityArea}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="sv-property" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Property Type
                      </label>
                      <select
                        id="sv-property"
                        value={formData.propertyType}
                        onChange={(e) => handleFieldChange("propertyType", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      >
                        {propertyTypes.map((pt) => (
                          <option key={pt} value={pt} className="bg-deccan-card text-white">{pt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Window Type & Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="sv-windowtype" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Window / Opening Type
                      </label>
                      <select
                        id="sv-windowtype"
                        value={formData.windowType}
                        onChange={(e) => handleFieldChange("windowType", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      >
                        {windowTypes.map((wt) => (
                          <option key={wt} value={wt} className="bg-deccan-card text-white">{wt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="sv-count" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Approximate Windows / Balconies
                      </label>
                      <input
                        id="sv-count"
                        type="text"
                        value={formData.approximateWindows}
                        onChange={(e) => handleFieldChange("approximateWindows", e.target.value)}
                        placeholder="e.g. 1 Balcony + 2 Windows"
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 5: Preferred Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="sv-date" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Preferred Visit Date
                      </label>
                      <input
                        id="sv-date"
                        type="date"
                        min={getTodayDateString()}
                        value={formData.preferredVisitDate}
                        onChange={(e) => handleFieldChange("preferredVisitDate", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="sv-time" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Preferred Time Slot
                      </label>
                      <select
                        id="sv-time"
                        value={formData.preferredTime}
                        onChange={(e) => handleFieldChange("preferredTime", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      >
                        <option value="Morning (10 AM - 1 PM)">Morning (10 AM – 1 PM)</option>
                        <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM – 4 PM)</option>
                        <option value="Evening (4 PM - 7 PM)">Evening (4 PM – 7 PM)</option>
                        <option value="Any Time">Any Time</option>
                      </select>
                    </div>
                  </div>

                  {/* Requirement Details */}
                  <div>
                    <label htmlFor="sv-requirement" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                      Requirement Details / Notes
                    </label>
                    <textarea
                      id="sv-requirement"
                      rows={3}
                      value={formData.requirementDetails}
                      onChange={(e) => handleFieldChange("requirementDetails", e.target.value)}
                      placeholder="e.g. 18th floor apartment, need child & pet safety with SS 316 wire."
                      className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm resize-none"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                      Upload Property Photos <span className="text-slate-500">(Optional, max {MAX_FILES})</span>
                    </label>

                    {/* Drop / Click Zone */}
                    <div
                      className="p-4 rounded-xl bg-deccan-card/60 border border-dashed border-white/20 hover:border-deccan-cyan/40 text-center space-y-2 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                      role="button"
                      tabIndex={0}
                      aria-label="Upload property photos"
                    >
                      <Upload className="w-5 h-5 text-slate-400 mx-auto" aria-hidden="true" />
                      <span className="text-xs text-slate-300 font-medium block">
                        Click to upload balcony or window photos
                      </span>
                      <span className="text-[11px] text-slate-500 font-light block">
                        JPG, JPEG, PNG, WEBP · Max {MAX_FILE_SIZE_MB}MB each · Up to {MAX_FILES} images
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        aria-hidden="true"
                        tabIndex={-1}
                      />
                    </div>

                    {/* File errors */}
                    {imageErrors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {imageErrors.map((err, i) => (
                          <p key={i} className="text-xs text-rose-400 flex items-center gap-1.5" role="alert">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                            {err}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Image Previews */}
                    {imageFiles.length > 0 && (
                      <div className="mt-3 image-preview-grid">
                        {imageFiles.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-white/10 bg-deccan-card"
                            style={{ aspectRatio: "1" }}
                          >
                            <Image
                              src={img.preview}
                              alt={`Preview of ${img.name}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                              aria-label={`Remove image ${img.name}`}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                            >
                              <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                            {/* Filename tooltip */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                              <span className="text-[9px] text-white truncate block font-mono">{img.name}</span>
                            </div>
                          </div>
                        ))}
                        {/* Add more */}
                        {imageFiles.length < MAX_FILES && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Add more images"
                            className="rounded-xl border border-dashed border-white/20 hover:border-deccan-cyan/40 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-deccan-cyan transition-colors"
                            style={{ aspectRatio: "1" }}
                          >
                            <ImageIcon className="w-5 h-5" aria-hidden="true" />
                            <span className="text-[9px] font-mono">Add</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-deccan-cyan text-deccan-dark font-display font-bold text-base hover:bg-cyan-300 transition-all shadow-xl shadow-deccan-cyan/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Submit free site visit request"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        <span>Scheduling Site Visit...</span>
                      </>
                    ) : (
                      <>
                        <span>Request Free Site Visit</span>
                        <Send className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <span className="text-[11px] font-mono text-slate-500">
                      *Zero obligation site visit with laser measurement across Hyderabad.
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
