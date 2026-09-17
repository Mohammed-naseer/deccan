"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { createEnquiry } from "@/services/api";
import { Send, MessageSquare, CheckCircle2, AlertCircle, Upload, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const propertyTypes = [
  "Apartment",
  "Villa",
  "Independent House",
  "Office",
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

export default function EnquiryForm() {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    whatsappNumber: "",
    email: "",
    cityArea: "",
    propertyType: "Apartment",
    windowType: "Balcony",
    approximateWindows: "1-2 Openings",
    preferredVisitDate: "",
    preferredTime: "Morning (10 AM - 1 PM)",
    requirementDetails: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [assignedId, setAssignedId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim() || !formData.phoneNumber.trim() || !formData.cityArea.trim()) {
      setErrorMsg("Please provide your name, phone number, and Hyderabad area/locality.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createEnquiry(formData);
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

  return (
    <section id="enquiry" className="py-24 bg-deccan-card/60 border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Left Column: Context & WhatsApp Quick Action */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
                Free Site Measurement & Consultation
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
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-white text-sm">
                    Structural On-Site Inspection
                  </h4>
                  <p className="text-xs text-slate-400 font-light">
                    Evaluation of window reveal depth, concrete slab integrity, or aluminium framing needs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-white text-sm">
                    Material Specification Guidance
                  </h4>
                  <p className="text-xs text-slate-400 font-light">
                    Direct advice on 2.5 mm vs 3.0 mm wire thickness and SS 316 vs SS 304 stainless steel.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-white text-sm">
                    Hyderabad Service Area Coverage
                  </h4>
                  <p className="text-xs text-slate-400 font-light">
                    Prompt scheduling across Gachibowli, Jubilee Hills, Banjara Hills, Kondapur, Madhapur, Kukatpally, and all surrounding localities.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Alternative Button */}
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
                <MessageSquare className="w-4 h-4" />
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
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-deccan-cyan uppercase tracking-widest block mb-1">
                      Request Confirmed
                    </span>
                    <h3 className="font-display text-2xl font-bold text-white">
                      Free Site Visit Requested!
                    </h3>
                    <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto font-light">
                      Thank you, <span className="font-semibold text-white">{formData.name}</span>. Your enquiry reference number is:
                    </p>
                    <div className="inline-block mt-3 px-4 py-2 rounded-lg bg-deccan-card border border-deccan-cyan/40 text-deccan-cyan font-mono text-base font-bold">
                      {assignedId}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 max-w-md mx-auto font-light">
                    Our technical surveyor will contact you at <span className="text-white">{formData.phoneNumber}</span> to confirm the appointment date and time slot.
                  </p>

                  <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={`/customer/dashboard`}
                      className="px-6 py-3 rounded-xl bg-deccan-cyan text-deccan-dark font-semibold text-sm hover:bg-cyan-300 transition-all"
                    >
                      View Live Tracking Demo
                    </a>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="px-6 py-3 rounded-xl bg-deccan-card border border-white/15 text-slate-300 hover:text-white text-sm"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {errorMsg && (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Row 1: Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ramesh Chandra"
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="+91 98480 00000"
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 2: WhatsApp & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        placeholder="Same as phone or alternate"
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 3: City Area & Property Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        City / Area (Hyderabad) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.cityArea}
                          onChange={(e) => setFormData({ ...formData, cityArea: e.target.value })}
                          placeholder="e.g. Gachibowli, Jubilee Hills"
                          className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Property Type
                      </label>
                      <select
                        value={formData.propertyType}
                        onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      >
                        {propertyTypes.map((pt) => (
                          <option key={pt} value={pt} className="bg-deccan-card text-white">
                            {pt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Window Type & Approximate Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Window / Opening Type
                      </label>
                      <select
                        value={formData.windowType}
                        onChange={(e) => setFormData({ ...formData, windowType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      >
                        {windowTypes.map((wt) => (
                          <option key={wt} value={wt} className="bg-deccan-card text-white">
                            {wt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Approximate Windows / Balconies
                      </label>
                      <input
                        type="text"
                        value={formData.approximateWindows}
                        onChange={(e) => setFormData({ ...formData, approximateWindows: e.target.value })}
                        placeholder="e.g. 1 Balcony + 2 Windows"
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 5: Preferred Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Preferred Visit Date
                      </label>
                      <input
                        type="date"
                        value={formData.preferredVisitDate}
                        onChange={(e) => setFormData({ ...formData, preferredVisitDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                        Preferred Time Slot
                      </label>
                      <select
                        value={formData.preferredTime}
                        onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      >
                        <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                        <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM - 4 PM)</option>
                        <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                        <option value="Any Time">Any Time</option>
                      </select>
                    </div>
                  </div>

                  {/* Requirement Details */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                      Requirement Details / Notes
                    </label>
                    <textarea
                      rows={3}
                      value={formData.requirementDetails}
                      onChange={(e) => setFormData({ ...formData, requirementDetails: e.target.value })}
                      placeholder="e.g. 18th floor apartment, need child & pet safety with SS 316 wire."
                      className="w-full px-4 py-3 rounded-xl bg-deccan-card border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm resize-none"
                    />
                  </div>

                  {/* Mock Photo Upload */}
                  <div className="p-4 rounded-xl bg-deccan-card/60 border border-dashed border-white/20 text-center space-y-1">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-300 font-medium block">
                      Attach Balcony or Window Photos (Optional)
                    </span>
                    <span className="text-[11px] text-slate-500 font-light block">
                      PNG, JPG up to 10MB. Helps preliminary wire estimation.
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-deccan-cyan text-deccan-dark font-display font-bold text-base hover:bg-cyan-300 transition-all shadow-xl shadow-deccan-cyan/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="inline-block animate-pulse">Scheduling Site Visit...</span>
                    ) : (
                      <>
                        <span>Request Free Site Visit</span>
                        <Send className="w-4 h-4" />
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
