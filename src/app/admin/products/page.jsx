"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct } from "@/services/api";
import { Package, Plus, Edit, Trash2, Check, RefreshCw, X, Shield } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    features: "",
    image: "/images/highrise_view.jpg",
    status: "published",
    highlight: "",
    displayOrder: 1,
  });
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminProducts();
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      features: "",
      image: "/images/highrise_view.jpg",
      status: "published",
      highlight: "",
      displayOrder: products.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription || "",
      description: p.description || "",
      features: Array.isArray(p.features) ? p.features.join(", ") : p.features || "",
      image: p.image || "/images/highrise_view.jpg",
      status: p.status || "published",
      highlight: p.highlight || "",
      displayOrder: p.displayOrder || 1,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      displayOrder: Number(form.displayOrder),
      features: typeof form.features === "string" ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : form.features,
    };

    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct._id, payload);
        setMsg("Product updated successfully.");
      } else {
        await createAdminProduct(payload);
        setMsg("Product added successfully.");
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to save product.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteAdminProduct(id);
      setMsg("Product removed.");
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
            Products &amp; Home Solutions Catalog
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Manage Invisible Grills, Mosquito Mesh, Cloth Hangers, UPVC Windows, Shoe Racks, and Security Doors.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#00C2CB]/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => (
          <div
            key={p._id || p.slug}
            className="bg-[#12181F] border border-white/10 rounded-3xl overflow-hidden flex flex-col group hover:border-[#00C2CB]/40 transition-colors"
          >
            <div className="relative h-44 w-full bg-slate-900">
              <Image src={p.image || "/images/highrise_view.jpg"} alt={p.name} fill className="object-cover" />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border ${
                    p.status === "published"
                      ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-900/80 text-slate-400 border-slate-700"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              {p.highlight && (
                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-[#00C2CB] text-[#0B0F12] text-[10px] font-bold">
                  {p.highlight}
                </div>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-[#00C2CB] block">
                  Slug: /{p.slug} · Order #{p.displayOrder}
                </span>
                <h3 className="font-display font-bold text-white text-lg">{p.name}</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed line-clamp-2">
                  {p.shortDescription}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <button
                  onClick={() => openEditModal(p)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs flex items-center gap-1.5 border border-white/10"
                >
                  <Edit className="w-3.5 h-3.5 text-[#00C2CB]" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(p._id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#12181F] border border-white/10 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-white text-lg">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-mono block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-mono block mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Short Description</label>
                <input
                  type="text"
                  required
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Full Technical Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Features (comma separated)</label>
                <input
                  type="text"
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="SS 316 Marine Grade, 400kg Load, Child Safe"
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-mono block mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-mono block mb-1">Highlight Badge</label>
                  <input
                    type="text"
                    value={form.highlight}
                    onChange={(e) => setForm({ ...form, highlight: e.target.value })}
                    placeholder="e.g. Flagship Product"
                    className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-mono block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                    className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00C2CB] text-[#0B0F12] font-semibold text-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
