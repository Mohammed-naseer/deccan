"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getAdminGallery, createAdminGallery, deleteAdminGallery, uploadImageMedia } from "@/services/api";
import { Image as ImageIcon, Plus, Trash2, Upload, RefreshCw, X, ExternalLink } from "lucide-react";

const CATEGORIES = [
  "All",
  "Balconies",
  "Windows",
  "Installation",
  "Details",
  "Cloth Hangers",
  "Mosquito Mesh",
  "UPVC Windows",
  "Shoe Racks",
  "Security Screen Doors",
  "Projects",
  "Other"
];

export default function AdminGalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Balconies",
    imageUrl: "",
    displayOrder: 1,
    status: "active"
  });
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminGallery();
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      if (!form.title) {
        setForm((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalImageUrl = form.imageUrl;
      let publicId = null;

      if (selectedFile) {
        const uploadRes = await uploadImageMedia(selectedFile);
        if (uploadRes.data?.secure_url) {
          finalImageUrl = uploadRes.data.secure_url;
          publicId = uploadRes.data.public_id;
        }
      }

      if (!finalImageUrl) {
        alert("Please select an image file or provide an image URL.");
        setUploading(false);
        return;
      }

      await createAdminGallery({
        ...form,
        imageUrl: finalImageUrl,
        publicId,
        displayOrder: Number(form.displayOrder)
      });

      setMsg("Photo uploaded and added to gallery.");
      setUploadModal(false);
      setSelectedFile(null);
      setFilePreview(null);
      loadData();
    } catch (err) {
      alert(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this photo from the gallery?")) return;
    try {
      await deleteAdminGallery(id);
      setMsg("Gallery photo removed.");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = categoryFilter === "All" ? items : items.filter((i) => i.category === categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Visual Gallery &amp; Installation Photos
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Upload and organize authentic customer installations with Cloudinary media storage.
          </p>
        </div>

        <button
          onClick={() => setUploadModal(true)}
          className="px-4 py-2 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#00C2CB]/20"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Photo</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto bg-[#12181F] p-1.5 rounded-2xl border border-white/10 custom-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? "bg-[#00C2CB] text-[#0B0F12] font-semibold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <div
            key={item._id || item.title}
            className="group relative bg-[#12181F] border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-[#00C2CB]/40 transition-colors"
          >
            <div className="relative h-44 w-full bg-black">
              <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/70 text-[#00C2CB] border border-[#00C2CB]/30">
                  {item.category}
                </span>
              </div>
            </div>

            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h4 className="font-semibold text-white text-xs truncate">{item.title}</h4>
                <p className="text-[11px] text-slate-400 font-light line-clamp-1">{item.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <a
                  href={item.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <span>View</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#12181F] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-white text-base">Upload Photo to Gallery</h3>
              <button onClick={() => setUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* File Drop Area */}
              <div className="border-2 border-dashed border-white/15 rounded-2xl p-4 text-center hover:border-[#00C2CB]/50 transition-colors">
                {filePreview ? (
                  <div className="relative h-32 w-full rounded-xl overflow-hidden mx-auto mb-2">
                    <Image src={filePreview} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#00C2CB] file:text-[#0B0F12] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Living Balcony SS 316 Grills"
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-mono block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-mono block mb-1">Order</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                    className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setUploadModal(false)} className="px-3 py-1.5 text-slate-400">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-[#00C2CB] text-[#0B0F12] font-semibold text-xs disabled:opacity-50"
                >
                  {uploading ? "Uploading to Cloudinary..." : "Upload & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
