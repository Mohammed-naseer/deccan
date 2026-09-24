"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { submitContact } from "@/services/api";
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  ArrowUpRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { motion } from "framer-motion";

const SERVICE_OPTIONS = [
  "Invisible Grills — Balcony",
  "Invisible Grills — Window",
  "Invisible Grills — Office / Commercial",
  "Cloth Hanger",
  "Mosquito Mesh",
  "General Enquiry",
  "Other",
];

const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  message: "",
  service: "",
  city: "",
};

const INITIAL_ERRORS = {
  name: "",
  phone: "",
  email: "",
  message: "",
  service: "",
  city: "",
};

function isValidPhone(phone) {
  const cleaned = phone.replace(/\s|-|\+91/g, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

export default function ContactSection() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [serverError, setServerError] = useState("");

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next = { ...INITIAL_ERRORS };
    let valid = true;

    if (!formData.name.trim()) { next.name = "Name is required."; valid = false; }
    if (!formData.phone.trim()) {
      next.phone = "Phone number is required."; valid = false;
    } else if (!isValidPhone(formData.phone)) {
      next.phone = "Enter a valid 10-digit Indian mobile number."; valid = false;
    }
    if (!formData.email.trim()) {
      next.email = "Email is required."; valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "Enter a valid email address."; valid = false;
    }
    if (!formData.message.trim()) {
      next.message = "Message is required."; valid = false;
    } else if (formData.message.trim().length < 10) {
      next.message = "Message must be at least 10 characters."; valid = false;
    }

    setErrors(next);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setStatus("submitting");
    try {
      // Structured for future POST /api/contact connection
      await submitContact({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
        service: formData.service || null,
        city: formData.city.trim() || null,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setServerError("Something went wrong. Please try calling us directly.");
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors(INITIAL_ERRORS);
    setStatus("idle");
    setServerError("");
  };

  return (
    <section id="contact" className="py-24 bg-deccan-dark relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-deccan-cyan/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            Get In Touch
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Contact Deccan Space Works
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
            Direct communication channels for site visits, technical queries, architectural specifications, and quotes in Hyderabad.
          </p>
        </div>

        {/* 4 Contact Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">

          {/* Call Us */}
          <div className="p-8 rounded-2xl bg-deccan-card/70 border border-white/10 hover:border-deccan-cyan/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan">
              <Phone className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Call Us</span>
              <div className="space-y-1 mt-2">
                {siteConfig.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className="font-display font-bold text-white text-base block hover:text-deccan-cyan transition-colors"
                    aria-label={`Call ${phone}`}
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>
            <a
              href={`tel:${siteConfig.phones[0]}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-deccan-cyan hover:underline pt-2"
              aria-label={`Call ${siteConfig.phones[0]}`}
            >
              <span>Call Direct</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          {/* WhatsApp */}
          <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/50 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">WhatsApp Chat</span>
              <span className="font-display font-bold text-white text-base block mt-2">+91 91007 20137</span>
              <span className="text-xs text-slate-400 font-light block mt-1">Fast responses for quotes &amp; photos</span>
            </div>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(siteConfig.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline pt-2"
              aria-label="Open WhatsApp chat"
            >
              <span>Open WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          {/* Email */}
          <div className="p-8 rounded-2xl bg-deccan-card/70 border border-white/10 hover:border-deccan-cyan/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan">
              <Mail className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Email Us</span>
              <a
                href={`mailto:${siteConfig.email}`}
                className="font-display font-bold text-white text-sm block mt-2 hover:text-deccan-cyan transition-colors break-all"
                aria-label={`Email ${siteConfig.email}`}
              >
                {siteConfig.email}
              </a>
              <span className="text-xs text-slate-400 font-light block mt-1">Architectural drawings &amp; tenders</span>
            </div>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-deccan-cyan hover:underline pt-2"
              aria-label={`Send email to ${siteConfig.email}`}
            >
              <span>Send Email</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          {/* Social / Instagram */}
          <div className="p-8 rounded-2xl bg-deccan-card/70 border border-white/10 hover:border-deccan-cyan/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <InstagramIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">Follow On Social</span>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display font-bold text-white text-base block mt-2 hover:text-purple-400 transition-colors"
                aria-label={`Follow us on Instagram at ${siteConfig.instagram}`}
              >
                {siteConfig.instagram}
              </a>
              <span className="text-xs text-slate-400 font-light block mt-1">Installation stories &amp; video reels</span>
            </div>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:underline pt-2"
              aria-label="View Instagram profile"
            >
              <span>View Profile</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* ── Contact Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start p-6 sm:p-10 rounded-3xl bg-deccan-card/60 border border-white/15 shadow-2xl">

            {/* Left: info */}
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block">
                Send Us a Message
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Have a Question or Requirement?
              </h3>
              <p className="text-slate-400 text-sm font-light leading-relaxed">
                Fill in the form and our team will get back to you within 24 hours. For urgent queries, please call or WhatsApp us directly.
              </p>
              <div className="pt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-deccan-cyan" aria-hidden="true" />
                  </div>
                  <span>Typically respond within <strong className="text-white">2–4 hours</strong> on business days</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-deccan-cyan" aria-hidden="true" />
                  </div>
                  <span>Serving all of <strong className="text-white">Hyderabad &amp; Telangana</strong></span>
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div>
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10 space-y-4"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h4 className="font-display text-xl font-bold text-white">Message Sent!</h4>
                  <p className="text-slate-300 text-sm font-light max-w-xs mx-auto">
                    Thank you, <span className="text-white font-semibold">{formData.name}</span>! We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-2 px-6 py-2.5 rounded-xl bg-deccan-cyan text-deccan-dark font-semibold text-sm hover:bg-cyan-300 transition-all"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-4"
                  aria-label="Contact enquiry form"
                >
                  {serverError && (
                    <div role="alert" className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Your full name"
                        aria-required="true"
                        aria-describedby={errors.name ? "contact-name-error" : undefined}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                      {errors.name && <p id="contact-name-error" className="mt-1 text-xs text-rose-400" role="alert">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="contact-phone" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        Phone <span className="text-rose-400">*</span>
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="+91 98480 00000"
                        aria-required="true"
                        aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                      {errors.phone && <p id="contact-phone-error" className="mt-1 text-xs text-rose-400" role="alert">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="name@example.com"
                      aria-required="true"
                      aria-describedby={errors.email ? "contact-email-error" : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                    />
                    {errors.email && <p id="contact-email-error" className="mt-1 text-xs text-rose-400" role="alert">{errors.email}</p>}
                  </div>

                  {/* Service & City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-service" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        Service / Product
                      </label>
                      <select
                        id="contact-service"
                        value={formData.service}
                        onChange={(e) => handleChange("service", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      >
                        <option value="">Select a service</option>
                        {SERVICE_OPTIONS.map((s) => (
                          <option key={s} value={s} className="bg-deccan-card">{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="contact-city" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        City / Area
                      </label>
                      <input
                        id="contact-city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="e.g. Gachibowli"
                        className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Message <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder="Tell us your requirement, property type, or any questions..."
                      aria-required="true"
                      aria-describedby={errors.message ? "contact-message-error" : undefined}
                      className="w-full px-4 py-3 rounded-xl bg-deccan-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan transition-colors text-sm resize-none"
                    />
                    {errors.message && <p id="contact-message-error" className="mt-1 text-xs text-rose-400" role="alert">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full py-3.5 rounded-xl bg-deccan-cyan text-deccan-dark font-display font-bold text-sm hover:bg-cyan-300 transition-all shadow-lg shadow-deccan-cyan/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="Send contact message"
                  >
                    {status === "submitting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>

        {/* Primary Service Area Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-deccan-card border border-white/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan flex-shrink-0 mt-0.5 sm:mt-0">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block">
                Primary Service Area
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                HYDERABAD &amp; Surrounding Telangana Regions
              </h3>
              <p className="text-xs text-slate-400 font-light mt-1 leading-relaxed">
                Gachibowli · Jubilee Hills · Banjara Hills · Hitec City · Kondapur · Kokapet · Madhapur · Manikonda · Tellapur
              </p>
            </div>
          </div>

          <a
            href="#enquiry"
            className="w-full md:w-auto text-center px-6 py-3.5 rounded-xl bg-deccan-cyan text-deccan-dark font-display font-bold text-sm hover:bg-cyan-300 transition-all flex-shrink-0"
          >
            Request Site Visit in Hyderabad
          </a>
        </div>

      </div>
    </section>
  );
}
