"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getAdminSiteVisits, updateSiteVisitStatus, deleteSiteVisit } from "@/services/api";
import {
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Home,
  CheckCircle,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  X,
  FileText,
} from "lucide-react";

const STATUSES = ["All", "new", "contacted", "scheduled", "completed", "cancelled"];

export default function AdminSiteVisitsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminSiteVisits(statusFilter, searchTerm);
      setItems(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateSiteVisitStatus(id, newStatus);
      setMsg(`Status updated to ${newStatus}.`);
      loadData();
      if (selectedVisit && selectedVisit._id === id) {
        setSelectedVisit((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedVisit) return;
    setActionLoading(true);
    try {
      await updateSiteVisitStatus(selectedVisit._id, selectedVisit.status, notes);
      setMsg("Admin notes saved.");
      loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSiteVisit(id);
      setDeleteConfirmId(null);
      if (selectedVisit?._id === id) setSelectedVisit(null);
      setMsg("Site visit request and associated media deleted.");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.phoneNumber?.includes(term) ||
      item.cityArea?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Free Site Visit Requests
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Manage Hyderabad site measurements, customer photos, scheduling, and engineering notes.
          </p>
        </div>

        <button
          onClick={loadData}
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
            placeholder="Search by customer name, phone, area, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#12181F] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2CB]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto bg-[#12181F] p-1 rounded-xl border border-white/10 custom-scrollbar">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize whitespace-nowrap transition-all ${
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

      {/* Main Table */}
      <div className="bg-[#12181F] border border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading site visits from MongoDB...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No site visit requests matching this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F12]/60 text-slate-400 font-mono border-b border-white/10 text-[11px] uppercase">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Property &amp; Window</th>
                  <th className="p-4">Preferred Slot</th>
                  <th className="p-4">Images</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-light">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white text-sm">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.phoneNumber}</div>
                      {item.email && <div className="text-[11px] text-slate-500">{item.email}</div>}
                    </td>

                    <td className="p-4">
                      <span className="flex items-center gap-1.5 font-medium text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-[#00C2CB]" />
                        <span>{item.cityArea}</span>
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="text-white font-medium">{item.propertyType || "Apartment"}</div>
                      <div className="text-slate-400 text-[11px]">{item.windowType || "Balcony"}</div>
                    </td>

                    <td className="p-4">
                      <div className="text-white font-mono">{item.preferredVisitDate || "Earliest"}</div>
                      <div className="text-slate-400 text-[11px]">{item.preferredTime}</div>
                    </td>

                    <td className="p-4">
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <div className="flex items-center -space-x-2">
                          {item.imageUrls.slice(0, 3).map((url, idx) => (
                            <div
                              key={idx}
                              className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 bg-black cursor-pointer"
                              onClick={() => {
                                setSelectedVisit(item);
                                setNotes(item.adminNotes || "");
                              }}
                            >
                              <Image src={url} alt="Site" fill className="object-cover" />
                            </div>
                          ))}
                          {item.imageUrls.length > 3 && (
                            <span className="w-8 h-8 rounded-lg bg-slate-800 text-[10px] font-mono flex items-center justify-center text-white border border-white/20">
                              +{item.imageUrls.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">None</span>
                      )}
                    </td>

                    <td className="p-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                        className={`text-[11px] font-mono uppercase px-2.5 py-1 rounded-xl border bg-[#0B0F12] focus:outline-none ${
                          item.status === "new"
                            ? "text-cyan-400 border-cyan-500/30"
                            : item.status === "scheduled"
                            ? "text-emerald-400 border-emerald-500/30"
                            : item.status === "completed"
                            ? "text-blue-400 border-blue-500/30"
                            : item.status === "cancelled"
                            ? "text-rose-400 border-rose-500/30"
                            : "text-amber-400 border-amber-500/30"
                        }`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedVisit(item);
                            setNotes(item.adminNotes || "");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-mono border border-white/10 transition-colors"
                        >
                          Details
                        </button>

                        {deleteConfirmId === item._id ? (
                          <div className="flex items-center gap-1 bg-rose-950/60 p-1 rounded-lg border border-rose-500/30">
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(item._id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal with Uploaded Photos */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12181F] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-bold text-white text-lg">
                  Site Visit Request: {selectedVisit.name}
                </h3>
                <span className="text-xs font-mono text-[#00C2CB]">
                  Location: {selectedVisit.cityArea} · Status: {selectedVisit.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#0B0F12] border border-white/5 space-y-1">
                <span className="text-slate-500 font-mono block">Phone Number</span>
                <span className="text-white font-medium text-sm flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <a href={`tel:${selectedVisit.phoneNumber}`} className="hover:underline">
                    {selectedVisit.phoneNumber}
                  </a>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0F12] border border-white/5 space-y-1">
                <span className="text-slate-500 font-mono block">Property Type</span>
                <span className="text-white font-medium text-sm">
                  {selectedVisit.propertyType} ({selectedVisit.windowType})
                </span>
              </div>
            </div>

            {selectedVisit.requirementDetails && (
              <div className="p-4 rounded-xl bg-[#0B0F12] border border-white/5 space-y-1">
                <span className="text-slate-500 font-mono text-xs block">Requirement Description</span>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {selectedVisit.requirementDetails}
                </p>
              </div>
            )}

            {/* Cloudinary Uploaded Site Images */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Customer Uploaded Photos ({selectedVisit.imageUrls?.length || 0})
              </span>
              {selectedVisit.imageUrls && selectedVisit.imageUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedVisit.imageUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative h-36 rounded-2xl overflow-hidden border border-white/15 block"
                    >
                      <Image src={url} alt="Site Photo" fill className="object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-mono gap-1">
                        <span>View Full</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-mono py-3">No photos uploaded for this site visit.</p>
              )}
            </div>

            {/* Admin Internal Notes */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                Internal Engineering &amp; Measurement Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add technician notes, balcony dimensions, quote amounts..."
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2CB]"
              />
              <button
                onClick={handleSaveNotes}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] text-xs font-semibold transition-colors"
              >
                {actionLoading ? "Saving..." : "Save Internal Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
