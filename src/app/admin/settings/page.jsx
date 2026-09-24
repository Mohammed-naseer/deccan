"use client";

import { useState, useEffect } from "react";
import { getAdminContent, updateAdminContent } from "@/services/api";
import { Settings, Save, ShieldAlert, CheckCircle, ExternalLink } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    businessName: "Deccan Space Works",
    contactPhone: "+91 9100720137",
    contactWhatsapp: "919100720137",
    contactEmail: "Deccanspaceworks@gmail.com",
    address: "Hyderabad, Telangana, India",
    instagramUrl: "https://instagram.com/deccan_space_works",
    facebookUrl: "https://facebook.com/deccanspaceworks",
    youtubeUrl: "https://youtube.com/@deccanspaceworks",
    googleMapsUrl: "https://maps.google.com",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getAdminContent().then((res) => {
      if (res.data) {
        setSettings((prev) => ({
          ...prev,
          contactPhone: res.data.contactPhone || prev.contactPhone,
          contactWhatsapp: res.data.contactWhatsapp || prev.contactWhatsapp,
          contactEmail: res.data.contactEmail || prev.contactEmail,
          instagramUrl: res.data.instagramUrl || prev.instagramUrl,
          facebookUrl: res.data.facebookUrl || prev.facebookUrl,
          youtubeUrl: res.data.youtubeUrl || prev.youtubeUrl,
          googleMapsUrl: res.data.googleMapsUrl || prev.googleMapsUrl,
        }));
      }
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAdminContent(settings);
      setMsg("Business settings updated successfully.");
    } catch (err) {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">
          Business Profile &amp; Social Links Settings
        </h2>
        <p className="text-xs text-slate-400 font-light">
          Manage public business contact numbers, official Instagram, Facebook, and Google Maps location details.
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Security Notice */}
      <div className="p-4 rounded-2xl bg-[#12181F] border border-amber-500/20 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-semibold text-white block">Security Protected Environment</span>
          <p className="text-slate-400 font-light leading-relaxed">
            Sensitive environment variables (JWT secrets, MongoDB URI, Cloudinary API keys, Resend credentials) are isolated in backend environment files and are never exposed or editable from the client interface.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-[#12181F] border border-white/10 space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 font-mono block mb-1.5">Business Name</label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
              className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 font-mono block mb-1.5">Business Email</label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 font-mono block mb-1.5">Primary Contact Phone</label>
            <input
              type="text"
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 font-mono block mb-1.5">WhatsApp Number</label>
            <input
              type="text"
              value={settings.contactWhatsapp}
              onChange={(e) => setSettings({ ...settings, contactWhatsapp: e.target.value })}
              className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <h4 className="font-display font-bold text-white text-sm">Social Profiles &amp; Google Maps</h4>

          <div className="space-y-3">
            <div>
              <label className="text-slate-300 font-mono block mb-1.5">Instagram URL</label>
              <input
                type="url"
                value={settings.instagramUrl}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono block mb-1.5">Facebook Page URL</label>
              <input
                type="url"
                value={settings.facebookUrl}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-mono block mb-1.5">Google Maps Link</label>
              <input
                type="url"
                value={settings.googleMapsUrl}
                onChange={(e) => setSettings({ ...settings, googleMapsUrl: e.target.value })}
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] font-semibold text-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Business Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
