"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getAdminMediaLibrary, uploadImageMedia, uploadVideoMedia } from "@/services/api";
import { FolderOpen, Upload, Copy, Check, ExternalLink, RefreshCw, FileText } from "lucide-react";

export default function AdminMediaLibraryPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState("");
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminMediaLibrary();
      setMedia(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      if (file.type.startsWith("video/")) {
        await uploadVideoMedia(file);
      } else {
        await uploadImageMedia(file);
      }
      setMsg(`File "${file.name}" uploaded successfully.`);
      loadData();
    } catch (err) {
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(""), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Media Library &amp; Cloudinary Storage
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Upload, preview, and copy secure Cloudinary URLs for site photos, diagrams, and videos.
          </p>
        </div>

        <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#00C2CB]/20 self-start sm:self-auto">
          <Upload className="w-4 h-4" />
          <span>{uploading ? "Uploading..." : "Upload Media Asset"}</span>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            accept="image/*,video/*"
          />
        </label>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 font-mono text-xs bg-[#12181F] rounded-3xl border border-white/10">
            No media uploaded to library yet. Click "Upload Media Asset" above to add images or videos.
          </div>
        ) : (
          media.map((item) => (
            <div
              key={item._id || item.url}
              className="bg-[#12181F] border border-white/10 rounded-2xl overflow-hidden flex flex-col group hover:border-[#00C2CB]/40 transition-colors"
            >
              <div className="relative h-32 w-full bg-black">
                {item.type === "video" ? (
                  <video src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <Image src={item.url} alt={item.name} fill className="object-cover" />
                )}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono uppercase text-white">
                  {item.format || item.type}
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2 text-xs">
                <span className="font-medium text-white truncate block text-[11px]">
                  {item.name}
                </span>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    onClick={() => copyToClipboard(item.url)}
                    className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white"
                  >
                    {copiedUrl === item.url ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-[#00C2CB]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
