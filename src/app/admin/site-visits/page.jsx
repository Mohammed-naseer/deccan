"use client";

import { useState, useEffect, useCallback } from "react";
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
  UserCheck,
  IndianRupee,
  Ruler,
  History,
  CalendarClock,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";

const STATUSES = ["All", "new", "contacted", "scheduled", "completed", "cancelled"];

export default function AdminSiteVisitsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [msg, setMsg] = useState("");
  const [fetchError, setFetchError] = useState(null);

  // Modal edit state
  const [modalStatus, setModalStatus] = useState("new");
  const [modalNotes, setModalNotes] = useState("");
  const [modalScheduledDate, setModalScheduledDate] = useState("");
  const [modalScheduledTime, setModalScheduledTime] = useState("");
  const [modalTechnician, setModalTechnician] = useState("");
  const [modalQuoteAmount, setModalQuoteAmount] = useState("");
  const [modalSqftEstimated, setModalSqftEstimated] = useState("");
  const [modalFollowUpDate, setModalFollowUpDate] = useState("");
  const [modalFollowUpNotes, setModalFollowUpNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getAdminSiteVisits(statusFilter);
      setItems(res.data?.items || []);
    } catch (err) {
      setFetchError(err.message || "Unable to load site visits from backend.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openVisitModal = (item) => {
    setSelectedVisit(item);
    setModalStatus(item.status || "new");
    setModalNotes(item.adminNotes || "");
    setModalScheduledDate(item.scheduledDate || "");
    setModalScheduledTime(item.scheduledTime || "");
    setModalTechnician(item.assignedTechnician || "");
    setModalQuoteAmount(item.quoteAmount !== undefined && item.quoteAmount !== null ? String(item.quoteAmount) : "");
    setModalSqftEstimated(item.sqftEstimated !== undefined && item.sqftEstimated !== null ? String(item.sqftEstimated) : "");
    setModalFollowUpDate(item.followUpDate || "");
    setModalFollowUpNotes(item.followUpNotes || "");
  };

  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      await updateSiteVisitStatus(id, { status: newStatus });
      setMsg(`Status updated to ${newStatus}.`);
      loadData();
      if (selectedVisit && selectedVisit._id === id) {
        setSelectedVisit((prev) => ({ ...prev, status: newStatus }));
        setModalStatus(newStatus);
      }
    } catch (err) {
      setMsg(err.message || "Failed to update status.");
    }
  };

  const handleSaveVisitDetails = async () => {
    if (!selectedVisit) return;
    setActionLoading(true);
    try {
      const payload = {
        status: modalStatus,
        adminNotes: modalNotes || null,
        scheduledDate: modalScheduledDate || null,
        scheduledTime: modalScheduledTime || null,
        assignedTechnician: modalTechnician || null,
        quoteAmount: modalQuoteAmount ? parseFloat(modalQuoteAmount) : null,
        sqftEstimated: modalSqftEstimated ? parseFloat(modalSqftEstimated) : null,
        followUpDate: modalFollowUpDate || null,
        followUpNotes: modalFollowUpNotes || null,
      };

      await updateSiteVisitStatus(selectedVisit._id, payload);
      setMsg("Site visit details, appointment, and engineering notes saved.");
      loadData();
      setSelectedVisit(null);
    } catch (err) {
      setMsg(err.message || "Failed to save site visit details.");
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
      setMsg(err.message || "Failed to delete site visit.");
    }
  };

  // Filter and sort
  const filteredAndSortedItems = items
    .filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        item.name?.toLowerCase().includes(term) ||
        item.phoneNumber?.includes(term) ||
        item.cityArea?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.trackingCode?.toLowerCase().includes(term) ||
        item.assignedTechnician?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "scheduledDate") {
        return new Date(a.scheduledDate || "9999-12-31") - new Date(b.scheduledDate || "9999-12-31");
      }
      if (sortBy === "followUp") {
        return new Date(a.followUpDate || "9999-12-31") - new Date(b.followUpDate || "9999-12-31");
      }
      // default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Site Visit &amp; Measurement Requests
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Manage Hyderabad site measurements, confirmed technician appointments, balcony quotes, and customer photos.
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
            placeholder="Search by customer name, phone, area, tracking ID, engineer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#12181F] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2CB]"
          />
        </div>

        <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-1 bg-[#12181F] p-1 rounded-xl border border-white/10 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-300 py-1 px-2 focus:outline-none cursor-pointer text-xs"
            >
              <option value="newest" className="bg-[#12181F]">Newest First</option>
              <option value="oldest" className="bg-[#12181F]">Oldest First</option>
              <option value="scheduledDate" className="bg-[#12181F]">Visit Date</option>
              <option value="followUp" className="bg-[#12181F]">Follow-up Due</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#12181F] border border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading site visits from MongoDB Atlas...
          </div>
        ) : fetchError ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-rose-400 font-mono text-xs">{fetchError}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl bg-[#00C2CB] text-[#0B0F12] text-xs font-semibold hover:bg-cyan-300 transition-all inline-flex items-center gap-2"
            >
              <span>Retry</span>
            </button>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No site visit requests matching this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F12]/60 text-slate-400 font-mono border-b border-white/10 text-[11px] uppercase">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Location &amp; Property</th>
                  <th className="p-4">Appointment Schedule</th>
                  <th className="p-4">Quote &amp; Area</th>
                  <th className="p-4">Photos</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-light">
                {filteredAndSortedItems.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white text-sm">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <a href={`tel:${item.phoneNumber}`} className="hover:underline">{item.phoneNumber}</a>
                      </div>
                      {item.trackingCode && (
                        <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                          {item.trackingCode}
                        </div>
                      )}
                      {item.followUpDate && (
                        <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                          <CalendarClock className="w-2.5 h-2.5" />
                          <span>Follow-up: {item.followUpDate}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="flex items-center gap-1.5 font-medium text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-[#00C2CB]" />
                        <span>{item.cityArea}</span>
                      </span>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {item.propertyType || "Apartment"} · {item.windowType || "Balcony"}
                      </div>
                    </td>

                    <td className="p-4">
                      {item.scheduledDate ? (
                        <div className="space-y-0.5">
                          <div className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            <span>Confirmed: {item.scheduledDate}</span>
                          </div>
                          {item.scheduledTime && (
                            <div className="text-[11px] text-slate-300 font-mono">
                              Slot: {item.scheduledTime}
                            </div>
                          )}
                          {item.assignedTechnician && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-cyan-400" />
                              <span>{item.assignedTechnician}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-400 space-y-0.5">
                          <div className="text-[11px] font-mono text-slate-300">
                            Pref: {item.preferredVisitDate || "Earliest"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Slot: {item.preferredTime || "Flexible"}
                          </div>
                          <span className="text-[10px] font-mono text-amber-400/80 italic block">
                            Pending Confirmation
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {item.quoteAmount ? (
                        <div className="font-mono text-emerald-400 font-semibold text-xs flex items-center gap-0.5">
                          <IndianRupee className="w-3 h-3" />
                          <span>{Number(item.quoteAmount).toLocaleString("en-IN")}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">Quote pending</span>
                      )}
                      {item.sqftEstimated && (
                        <div className="text-slate-400 text-[11px] font-mono flex items-center gap-1 mt-0.5">
                          <Ruler className="w-3 h-3 text-slate-500" />
                          <span>{item.sqftEstimated} sq ft</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <div className="flex items-center -space-x-2">
                          {item.imageUrls.slice(0, 3).map((url, idx) => (
                            <div
                              key={idx}
                              className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 bg-black cursor-pointer hover:z-10 transition-transform"
                              onClick={() => openVisitModal(item)}
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
                        onChange={(e) => handleQuickStatusChange(item._id, e.target.value)}
                        className={`text-[11px] font-mono uppercase px-2.5 py-1 rounded-xl border bg-[#0B0F12] focus:outline-none cursor-pointer ${
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
                          onClick={() => openVisitModal(item)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-mono border border-white/10 transition-colors"
                        >
                          Manage
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

      {/* Detail & Management Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12181F] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-white text-lg">
                    {selectedVisit.name}
                  </h3>
                  {selectedVisit.trackingCode && (
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-[10px]">
                      {selectedVisit.trackingCode}
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-[#00C2CB]">
                  Location: {selectedVisit.cityArea} · Preferred: {selectedVisit.preferredVisitDate || "Earliest"} ({selectedVisit.preferredTime})
                </span>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0B0F12] border border-white/5 space-y-1">
                <span className="text-slate-500 font-mono block">Contact Phone &amp; Email</span>
                <span className="text-white font-medium text-sm flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <a href={`tel:${selectedVisit.phoneNumber}`} className="hover:underline">
                    {selectedVisit.phoneNumber}
                  </a>
                </span>
                {selectedVisit.email && (
                  <span className="text-slate-400 text-xs block font-mono">
                    {selectedVisit.email}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#0B0F12] border border-white/5 space-y-1">
                <span className="text-slate-500 font-mono block">Property &amp; Installation Type</span>
                <span className="text-white font-medium text-sm">
                  {selectedVisit.propertyType} ({selectedVisit.windowType})
                </span>
                {selectedVisit.approximateWindows && (
                  <span className="text-slate-400 text-xs block">
                    Openings: {selectedVisit.approximateWindows}
                  </span>
                )}
              </div>
            </div>

            {selectedVisit.requirementDetails && (
              <div className="p-3.5 rounded-xl bg-[#0B0F12] border border-white/5 space-y-1">
                <span className="text-slate-500 font-mono text-xs block">Customer Requirement Details</span>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {selectedVisit.requirementDetails}
                </p>
              </div>
            )}

            {/* Customer Uploaded Photos */}
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
                      className="group relative h-28 rounded-2xl overflow-hidden border border-white/15 block"
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
                <p className="text-xs text-slate-500 font-mono py-2">No photos uploaded by customer.</p>
              )}
            </div>

            {/* Confirmed Appointment Scheduling Section */}
            <div className="p-4 rounded-2xl bg-[#0B0F12] border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Business-Confirmed Appointment &amp; Technician
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                Confirm real schedule date and field engineer after speaking with the customer.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Confirmed Date</label>
                  <input
                    type="date"
                    value={modalScheduledDate}
                    onChange={(e) => setModalScheduledDate(e.target.value)}
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Confirmed Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 11:30 AM or Morning"
                    value={modalScheduledTime}
                    onChange={(e) => setModalScheduledTime(e.target.value)}
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Assigned Field Engineer</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={modalTechnician}
                    onChange={(e) => setModalTechnician(e.target.value)}
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Measurement & Quote Section */}
            <div className="p-4 rounded-2xl bg-[#0B0F12] border border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                  Laser Measurement &amp; Commercial Quotation
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Estimated Area (sq ft)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 145.5"
                    value={modalSqftEstimated}
                    onChange={(e) => setModalSqftEstimated(e.target.value)}
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Quotation Amount (₹)</label>
                  <input
                    type="number"
                    step="100"
                    placeholder="e.g. 24500"
                    value={modalQuoteAmount}
                    onChange={(e) => setModalQuoteAmount(e.target.value)}
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Follow-up & Lifecycle Status */}
            <div className="p-4 rounded-2xl bg-[#0B0F12] border border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                  Follow-Up &amp; Lead Status
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Current Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="new">New (Uncontacted)</option>
                    <option value="contacted">Contacted</option>
                    <option value="scheduled">Scheduled (Visit Confirmed)</option>
                    <option value="completed">Completed (Measured / Installed)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={modalFollowUpDate}
                    onChange={(e) => setModalFollowUpDate(e.target.value)}
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Follow-up Action Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Call after 5 PM regarding balcony quote"
                    value={modalFollowUpNotes}
                    onChange={(e) => setModalFollowUpNotes(e.target.value)}
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* Admin Internal Notes */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                Internal Engineering &amp; Measurement Notes (Admin Only)
              </label>
              <textarea
                rows={3}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Add technician notes, balcony dimensions, wall anchor details, quote notes..."
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2CB]"
              />
            </div>

            {/* Action History Timeline */}
            {selectedVisit.history && selectedVisit.history.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#0B0F12] border border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                  <History className="w-3.5 h-3.5" />
                  <span>Action History Timeline</span>
                </div>
                <div className="space-y-2 divide-y divide-white/5 pt-1">
                  {selectedVisit.history.map((hist, idx) => (
                    <div key={idx} className="pt-2 text-[11px] flex items-start justify-between">
                      <div>
                        <span className="text-slate-200 font-medium">{hist.description}</span>
                        <div className="text-slate-500 text-[10px]">by {hist.adminEmail}</div>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px] whitespace-nowrap ml-2">
                        {new Date(hist.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVisitDetails}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save All Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
