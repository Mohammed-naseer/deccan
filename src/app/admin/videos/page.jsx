"use client";

import { useState, useEffect } from "react";
import { getAdminVideos, createAdminVideo, deleteAdminVideo, uploadVideoMedia } from "@/services/api";
import { Video, Plus, Trash2, Upload, RefreshCw, Play, ExternalLink } from "lucide-react";

export default function AdminVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    category: "Installation",
    videoUrl: "",
    thumbnailUrl: "/images/highrise_view.jpg",
    tag: "INSTALLATION PROCESS",
    displayOrder: 1,
  });
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminVideos();
      setVideos(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalUrl = form.videoUrl;
      let publicId = null;

      if (selectedFile) {
        const uploadRes = await uploadVideoMedia(selectedFile);
        if (uploadRes.data?.secure_url) {
          finalUrl = uploadRes.data.secure_url;
          publicId = uploadRes.data.public_id;
        }
      }

      if (!finalUrl) {
        alert("Please select a video file or enter an MP4/YouTube URL.");
        setUploading(false);
        return;
      }

      await createAdminVideo({
        ...form,
        videoUrl: finalUrl,
        publicId,
        displayOrder: Number(form.displayOrder),
      });

      setMsg("Video saved successfully.");
      setModalOpen(false);
      setSelectedFile(null);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to save video.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this video?")) return;
    try {
      await deleteAdminVideo(id);
      setMsg("Video deleted.");
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
            Video Showcase Management
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Upload installation walkthroughs, product finish quality showcases, or link YouTube videos.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#00C2CB]/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Video</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map((v) => (
          <div
            key={v._id || v.title}
            className="bg-[#12181F] border border-white/10 rounded-3xl overflow-hidden flex flex-col group hover:border-[#00C2CB]/40 transition-colors"
          >
            <div className="relative aspect-video w-full bg-black">
              {v.videoUrl?.endsWith(".mp4") ? (
                <video src={v.videoUrl} controls className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                  <span>External video: {v.videoUrl}</span>
                </div>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#00C2CB] block">
                  {v.tag || v.category}
                </span>
                <h3 className="font-display font-bold text-white text-base">{v.title}</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  {v.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-[11px] font-mono text-slate-500">Order #{v.displayOrder}</span>
                <button
                  onClick={() => handleDelete(v._id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
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
          <div className="bg-[#12181F] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-white text-base">Add Video</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-white/15 rounded-2xl p-4 text-center">
                <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="text-xs text-slate-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Or Direct Video URL</label>
                <input
                  type="text"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://... or /videos/install_video_1.mp4"
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 text-slate-400">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-[#00C2CB] text-[#0B0F12] font-semibold text-xs disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Save Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
