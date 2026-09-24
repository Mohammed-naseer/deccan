"use client";

import { useState, useEffect } from "react";
import { getAdminReviews, approveReview, rejectReview, deleteReview } from "@/services/api";
import { Star, CheckCircle2, XCircle, Trash2, Search, Filter, AlertCircle, RefreshCw } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [msg, setMsg] = useState("");

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await getAdminReviews(statusFilter, searchTerm);
      setReviews(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveReview(id);
      setMsg("Review approved successfully.");
      loadReviews();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await rejectReview(id);
      setMsg("Review marked as rejected.");
      loadReviews();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      await deleteReview(id);
      setDeleteConfirmId(null);
      setMsg("Review deleted permanently.");
      loadReviews();
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.review?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Search/Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Customer Reviews Management
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Review, approve, or reject customer feedback. Only approved reviews appear on the live website.
          </p>
        </div>

        <button
          onClick={loadReviews}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-2 border border-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews by name, content, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#12181F] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2CB]"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#12181F] p-1 rounded-xl border border-white/10">
          {["All", "pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${
                statusFilter === status
                  ? "bg-[#00C2CB] text-[#0B0F12] font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / Cards */}
      <div className="bg-[#12181F] border border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading reviews from database...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No reviews matching this query.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredReviews.map((item) => (
              <div
                key={item._id}
                className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white text-sm">{item.name}</span>
                    <span className="text-[11px] text-slate-400 font-light">· {item.city || "Hyderabad"}</span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                        item.status === "approved"
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                          : item.status === "rejected"
                          ? "bg-rose-950/40 text-rose-400 border-rose-500/30"
                          : "bg-amber-950/40 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= (item.rating || 5)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-700"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    "{item.review}"
                  </p>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Submitted: {new Date(item.createdAt || Date.now()).toLocaleDateString("en-IN")}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {item.status !== "approved" && (
                    <button
                      onClick={() => handleApprove(item._id)}
                      disabled={actionLoading === item._id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {item.status !== "rejected" && (
                    <button
                      onClick={() => handleReject(item._id)}
                      disabled={actionLoading === item._id}
                      className="px-3 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  {deleteConfirmId === item._id ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/30 p-1 rounded-xl">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 text-slate-400 hover:text-white text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(item._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
