"use client";

import { useState, useEffect } from "react";
import { getAdminContent, updateAdminContent } from "@/services/api";
import { Save, RefreshCw, Sliders, Shield, Award, CheckCircle } from "lucide-react";

export default function AdminContentPage() {
  const [content, setContent] = useState({
    heroHeading: "Upgrade Your Home With Smart & Stylish Solutions",
    heroSubtitle: "Premium Home Safety & Space Management Services",
    heroDescription: "Invisible Grills • Cloth Hangers • Mosquito Mesh • UPVC Windows • Shoe Racks • Security Screen Doors",
    ctaText: "Get a Free Site Visit",
    installationCount: "8,000+",
    customerSatisfaction: "100%",
    yearsExperience: "5+ Years",
    companyDescription: "Delivering dependable space management and architectural protection for modern living in Hyderabad.",
    contactPhone: "+91 9100720137",
    contactWhatsapp: "919100720137",
    contactEmail: "Deccanspaceworks@gmail.com",
    instagramUrl: "https://instagram.com/deccan_space_works",
    facebookUrl: "",
    youtubeUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminContent();
      if (res.data) setContent(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAdminContent(content);
      setMsg("Website copy, statistics, and business information updated successfully.");
    } catch (err) {
      alert("Failed to update website content.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Website Content &amp; Statistics Management
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Edit live website copy, headline banners, installation count, and business contact information without code changes.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-2 border border-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reload</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Hero Section Copy */}
        <div className="p-6 rounded-3xl bg-[#12181F] border border-white/10 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="font-display font-bold text-white text-base">Hero Section Banners</h3>
            <p className="text-[11px] text-slate-400">Headlines and main call-to-action on top of the landing page</p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-mono block mb-1.5">Hero Main Heading</label>
              <input
                type="text"
                value={content.heroHeading}
                onChange={(e) => setContent({ ...content, heroHeading: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-[#00C2CB]"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono block mb-1.5">Hero Subtitle</label>
              <input
                type="text"
                value={content.heroSubtitle}
                onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-[#00C2CB]"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono block mb-1.5">Services Tagline / Overview</label>
              <input
                type="text"
                value={content.heroDescription}
                onChange={(e) => setContent({ ...content, heroDescription: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-[#00C2CB]"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono block mb-1.5">Primary CTA Button Label</label>
              <input
                type="text"
                value={content.ctaText}
                onChange={(e) => setContent({ ...content, ctaText: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-[#00C2CB]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Live Statistics */}
        <div className="p-6 rounded-3xl bg-[#12181F] border border-white/10 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="font-display font-bold text-white text-base">
              Approved Live Statistics
            </h3>
            <p className="text-[11px] text-slate-400">
              Modify the installation count, satisfaction rate, and experience years displayed across the website.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#0B0F12] border border-white/5 space-y-2">
              <label className="text-[#00C2CB] font-mono block">
                Installations in Hyderabad
              </label>
              <input
                type="text"
                value={content.installationCount}
                onChange={(e) => setContent({ ...content, installationCount: e.target.value })}
                placeholder="8,000+"
                className="w-full bg-[#12181F] border border-white/15 rounded-xl p-2.5 text-white font-display text-lg font-bold"
              />
              <span className="text-[10px] text-slate-500 block">Default: 8,000+</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0F12] border border-white/5 space-y-2">
              <label className="text-emerald-400 font-mono block">
                Customer Satisfaction
              </label>
              <input
                type="text"
                value={content.customerSatisfaction}
                onChange={(e) => setContent({ ...content, customerSatisfaction: e.target.value })}
                placeholder="100%"
                className="w-full bg-[#12181F] border border-white/15 rounded-xl p-2.5 text-white font-display text-lg font-bold"
              />
              <span className="text-[10px] text-slate-500 block">Default: 100%</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0F12] border border-white/5 space-y-2">
              <label className="text-white font-mono block">
                Years of Trusted Service
              </label>
              <input
                type="text"
                value={content.yearsExperience}
                onChange={(e) => setContent({ ...content, yearsExperience: e.target.value })}
                placeholder="5+ Years"
                className="w-full bg-[#12181F] border border-white/15 rounded-xl p-2.5 text-white font-display text-lg font-bold"
              />
              <span className="text-[10px] text-slate-500 block">Default: 5+ Years</span>
            </div>
          </div>
        </div>

        {/* Section 3: Company & Business Info */}
        <div className="p-6 rounded-3xl bg-[#12181F] border border-white/10 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="font-display font-bold text-white text-base">Business &amp; Contact Details</h3>
            <p className="text-[11px] text-slate-400">Phone numbers, WhatsApp number, and email displayed on the site</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-mono block mb-1">Display Phone Number</label>
              <input
                type="text"
                value={content.contactPhone}
                onChange={(e) => setContent({ ...content, contactPhone: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono block mb-1">WhatsApp Number (e.g. 919100720137)</label>
              <input
                type="text"
                value={content.contactWhatsapp}
                onChange={(e) => setContent({ ...content, contactWhatsapp: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono block mb-1">Business Email</label>
              <input
                type="email"
                value={content.contactEmail}
                onChange={(e) => setContent({ ...content, contactEmail: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] font-semibold text-xs flex items-center gap-2 shadow-lg shadow-[#00C2CB]/25 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Publish Website Content Updates"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
