"use client";

import { useState, useEffect } from "react";
import { getAdminTestimonials, createAdminTestimonial, updateAdminTestimonial, deleteAdminTestimonial } from "@/services/api";
import { Star, Plus, Trash2, CheckCircle2, RefreshCw } from "lucide-react";

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "Hyderabad",
    property: "",
    rating: 5,
    message: "",
    highlight: "",
    status: "approved",
    displayOrder: 1,
  });
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminTestimonials();
      setItems(res.data || []);
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
    try {
      await createAdminTestimonial({ ...form, rating: Number(form.rating), displayOrder: Number(form.displayOrder) });
      setMsg("Testimonial added.");
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to save.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      await deleteAdminTestimonial(id);
      setMsg("Testimonial deleted.");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Client Testimonials Management
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Manage verified client reviews and feedback highlights. Only approved testimonials appear publicly.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#00C2CB]/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((t) => (
          <div
            key={t._id || t.name}
            className="p-5 rounded-3xl bg-[#12181F] border border-white/10 flex flex-col justify-between space-y-4 hover:border-[#00C2CB]/40 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{t.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">{t.property || t.city}</span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                  {t.status}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-xs text-slate-300 font-light leading-relaxed">
                "{t.message}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono text-[#00C2CB]">Highlight: {t.highlight || "Verified"}</span>
              <button
                onClick={() => handleDelete(t._id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#12181F] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-white text-base">Add Verified Testimonial</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-mono block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-mono block mb-1">City / Area</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-mono block mb-1">Property Type</label>
                  <input
                    type="text"
                    value={form.property}
                    onChange={(e) => setForm({ ...form, property: e.target.value })}
                    placeholder="e.g. 3BHK Apartment"
                    className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Review Highlight</label>
                <input
                  type="text"
                  value={form.highlight}
                  onChange={(e) => setForm({ ...form, highlight: e.target.value })}
                  placeholder="e.g. Completed in a single day"
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Full Testimonial</label>
                <textarea
                  rows={3}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#00C2CB] text-[#0B0F12] font-semibold">
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
