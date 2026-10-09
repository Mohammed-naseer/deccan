"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getAdminContacts,
  updateContactStatus,
  deleteContact,
  convertContactToSiteVisit,
} from "@/services/api";
import {
  Phone,
  Mail,
  MapPin,
  Search,
  RefreshCw,
  Trash2,
  Calendar,
  Clock,
  Flame,
  ArrowUpRight,
  History,
  X,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const STATUSES = ["All", "new", "contacted", "in-progress", "resolved", "closed"];

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | followup
  const [selectedContact, setSelectedContact] = useState(null);

  // Modal editing state
  const [modalStatus, setModalStatus] = useState("new");
  const [modalQuality, setModalQuality] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalFollowUpDate, setModalFollowUpDate] = useState("");
  const [modalFollowUpNotes, setModalFollowUpNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Convert to site visit state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertDate, setConvertDate] = useState("");
  const [convertTime, setConvertTime] = useState("Morning (10 AM - 1 PM)");
  const [convertPropType, setConvertPropType] = useState("Apartment");
  const [convertWinType, setConvertWinType] = useState("Balcony");
  const [convertNotes, setConvertNotes] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [msg, setMsg] = useState("");
  const [fetchError, setFetchError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getAdminContacts(statusFilter);
      setContacts(res.data?.items || []);
    } catch (err) {
      setFetchError(err.message || "Unable to load contact enquiries from backend.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openLeadModal = (item) => {
    setSelectedContact(item);
    setModalStatus(item.status || "new");
    setModalQuality(item.leadQuality || "");
    setModalNotes(item.adminNotes || "");
    setModalFollowUpDate(item.followUpDate || "");
    setModalFollowUpNotes(item.followUpNotes || "");
    setShowConvertModal(false);
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateContactStatus(id, { status });
      setMsg(`Contact status updated to ${status}.`);
      loadData();
    } catch (err) {
      setMsg(err.message || "Failed to update status.");
    }
  };

  const handleSaveLeadDetails = async () => {
    if (!selectedContact) return;
    setActionLoading(true);
    try {
      await updateContactStatus(selectedContact._id, {
        status: modalStatus,
        leadQuality: modalQuality || null,
        adminNotes: modalNotes || null,
        followUpDate: modalFollowUpDate || null,
        followUpNotes: modalFollowUpNotes || null,
      });
      setMsg("Lead details and follow-up saved.");
      loadData();
      setSelectedContact(null);
    } catch (err) {
      setMsg(err.message || "Failed to save lead details.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSiteVisit = async () => {
    if (!selectedContact) return;
    setActionLoading(true);
    try {
      const res = await convertContactToSiteVisit(selectedContact._id, {
        preferredVisitDate: convertDate || null,
        preferredTime: convertTime,
        propertyType: convertPropType,
        windowType: convertWinType,
        requirementDetails: convertNotes || selectedContact.message,
      });
      setMsg(`Site visit ${res.data?.trackingCode || ""} scheduled successfully!`);
      loadData();
      setSelectedContact(null);
      setShowConvertModal(false);
    } catch (err) {
      setMsg(err.message || "Failed to convert enquiry to site visit.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteContact(id);
      setDeleteConfirmId(null);
      setMsg("Enquiry deleted.");
      loadData();
    } catch (err) {
      setMsg(err.message || "Failed to delete enquiry.");
    }
  };

  const filtered = contacts
    .filter((c) => {
      const term = searchTerm.toLowerCase();
      return (
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.message?.toLowerCase().includes(term) ||
        c.city?.toLowerCase().includes(term) ||
        c.linkedSiteVisitCode?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "followup") {
        if (!a.followUpDate) return 1;
        if (!b.followUpDate) return -1;
        return new Date(a.followUpDate) - new Date(b.followUpDate);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Lead &amp; Enquiry Management
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Manage customer enquiries, set follow-up callbacks, assign lead priority, and convert to site visits.
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
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{msg}</span>
          </div>
          <button onClick={() => setMsg("")} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, message, or Hyderabad area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#12181F] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2CB]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
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

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#12181F] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none font-mono"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="followup">Follow-Up Date</option>
          </select>
        </div>
      </div>

      {/* Enquiries Grid */}
      <div className="bg-[#12181F] border border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading enquiries from MongoDB Atlas...
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
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No customer enquiries found matching the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-4"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white text-sm">{item.name}</span>
                    <span className="text-[11px] font-mono text-[#00C2CB] px-2 py-0.5 rounded-full bg-[#00C2CB]/10 border border-[#00C2CB]/20">
                      {item.service || "General Enquiry"}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#00C2CB]" />
                      <span>{item.city || "Hyderabad"}</span>
                    </span>

                    {/* Lead Quality Tag */}
                    {item.leadQuality && (
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          item.leadQuality === "hot"
                            ? "bg-rose-950/60 text-rose-400 border-rose-500/40"
                            : item.leadQuality === "warm"
                            ? "bg-amber-950/60 text-amber-400 border-amber-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        <Flame className="w-3 h-3" />
                        <span>{item.leadQuality} LEAD</span>
                      </span>
                    )}

                    {/* Linked Site Visit Tag */}
                    {item.linkedSiteVisitCode && (
                      <Link
                        href="/admin/site-visits"
                        className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full hover:underline flex items-center gap-1"
                      >
                        <span>Visit: {item.linkedSiteVisitCode}</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>

                  {/* Customer Contact Methods */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <a href={`tel:${item.phone}`} className="hover:underline text-white font-medium">
                        {item.phone}
                      </a>
                    </span>
                    {item.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <a href={`mailto:${item.email}`} className="hover:underline">
                          {item.email}
                        </a>
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-light">
                      Received: {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                    </span>
                  </div>

                  {/* Customer Enquiry Message */}
                  <p className="text-xs text-slate-200 font-light bg-[#0B0F12]/70 p-3 rounded-2xl border border-white/5 leading-relaxed">
                    &quot;{item.message}&quot;
                  </p>

                  {/* Follow-up / Admin Notes Snapshot */}
                  {(item.followUpDate || item.adminNotes) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {item.followUpDate && (
                        <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-[#00C2CB]" />
                          <span>Follow-Up Due: {item.followUpDate}</span>
                          {item.followUpNotes && <span className="text-slate-400">({item.followUpNotes})</span>}
                        </div>
                      )}
                      {item.adminNotes && (
                        <div className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-500/20 px-2.5 py-1 rounded-xl font-mono">
                          Internal Note: {item.adminNotes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5 lg:self-center">
                  <select
                    value={item.status || "new"}
                    onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    className={`text-xs font-mono uppercase px-2.5 py-1.5 rounded-xl border bg-[#0B0F12] focus:outline-none ${
                      item.status === "new"
                        ? "text-cyan-400 border-cyan-500/30"
                        : item.status === "contacted"
                        ? "text-amber-400 border-amber-500/30"
                        : item.status === "in-progress"
                        ? "text-emerald-400 border-emerald-500/30"
                        : item.status === "resolved"
                        ? "text-blue-400 border-blue-500/30"
                        : "text-slate-400 border-slate-700"
                    }`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <button
                    onClick={() => openLeadModal(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/15 transition-colors"
                  >
                    Manage Lead
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
                        className="px-1.5 py-0.5 text-slate-400 text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(item._id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                      title="Delete Enquiry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Lead Management Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12181F] border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#00C2CB] block">
                  Lead Workflow Management
                </span>
                <h3 className="font-display font-bold text-white text-lg">
                  {selectedContact.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Phone: {selectedContact.phone} · City: {selectedContact.city || "Hyderabad"}
                </span>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action: Convert to Site Visit Button */}
            {!selectedContact.linkedSiteVisitCode && !showConvertModal && (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-emerald-400 block">
                    Convert Enquiry to Site Visit
                  </span>
                  <p className="text-[11px] text-slate-300 font-light">
                    Customer wants laser measurement or structural quotation? Schedule a site visit with one click.
                  </p>
                </div>
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B0F12] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Schedule Site Visit</span>
                </button>
              </div>
            )}

            {/* Convert to Site Visit Panel */}
            {showConvertModal && (
              <div className="p-5 rounded-2xl bg-[#0B0F12] border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                    Schedule Linked Site Visit
                  </h4>
                  <button
                    onClick={() => setShowConvertModal(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Preferred Date</label>
                    <input
                      type="date"
                      value={convertDate}
                      onChange={(e) => setConvertDate(e.target.value)}
                      className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Time Slot</label>
                    <select
                      value={convertTime}
                      onChange={(e) => setConvertTime(e.target.value)}
                      className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                      <option value="Afternoon (1 PM - 4 PM)">Afternoon (1 PM - 4 PM)</option>
                      <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Property Type</label>
                    <select
                      value={convertPropType}
                      onChange={(e) => setConvertPropType(e.target.value)}
                      className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                      <option value="Independent House">Independent House</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Opening Type</label>
                    <select
                      value={convertWinType}
                      onChange={(e) => setConvertWinType(e.target.value)}
                      className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Balcony">Balcony</option>
                      <option value="Window">Window</option>
                      <option value="Staircase">Staircase</option>
                      <option value="Terrace">Terrace</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Requirement Notes</label>
                  <input
                    type="text"
                    value={convertNotes}
                    onChange={(e) => setConvertNotes(e.target.value)}
                    placeholder="e.g. 15th floor balcony, 3.0mm SS 316 required..."
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <button
                  onClick={handleConvertToSiteVisit}
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B0F12] text-xs font-semibold"
                >
                  {actionLoading ? "Scheduling..." : "Confirm & Create Site Visit Lead"}
                </button>
              </div>
            )}

            {/* Lead Status & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-mono block mb-1.5">Lead Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00C2CB]"
                >
                  <option value="new">New (Uncontacted)</option>
                  <option value="contacted">Contacted (Called customer)</option>
                  <option value="in-progress">In-Progress (Discussion / Quote)</option>
                  <option value="resolved">Resolved (Won / Completed)</option>
                  <option value="closed">Closed (Not Interested)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1.5">Lead Priority</label>
                <select
                  value={modalQuality}
                  onChange={(e) => setModalQuality(e.target.value)}
                  className="w-full bg-[#0B0F12] border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00C2CB]"
                >
                  <option value="">Normal Priority</option>
                  <option value="hot">🔥 Hot Lead (High Urgency)</option>
                  <option value="warm">⚡ Warm Lead (Interested)</option>
                  <option value="cold">❄️ Cold Lead (Future enquiry)</option>
                </select>
              </div>
            </div>

            {/* Follow-Up Controls */}
            <div className="p-4 rounded-2xl bg-[#0B0F12] border border-white/5 space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#00C2CB] block">
                Next Follow-Up Schedule
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Follow-Up Date</label>
                  <input
                    type="date"
                    value={modalFollowUpDate}
                    onChange={(e) => setModalFollowUpDate(e.target.value)}
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Follow-Up Action / Note</label>
                  <input
                    type="text"
                    value={modalFollowUpNotes}
                    onChange={(e) => setModalFollowUpNotes(e.target.value)}
                    placeholder="e.g. Call back after 6 PM, discuss SS 316..."
                    className="w-full bg-[#12181F] border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 block">
                Internal Admin Notes (Private)
              </label>
              <textarea
                rows={3}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Log discussion notes, budget constraints, balcony dimensions..."
                className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2CB]"
              />
            </div>

            {/* Chronological Action History Timeline */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                <History className="w-3.5 h-3.5 text-[#00C2CB]" />
                <span>Lead Activity Timeline</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {selectedContact.history && selectedContact.history.length > 0 ? (
                  selectedContact.history.map((hist, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#0B0F12] border border-white/5 text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-slate-400 font-mono">
                        <span className="text-[#00C2CB]">{hist.action}</span>
                        <span>{hist.timestamp ? new Date(hist.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      </div>
                      <p className="text-slate-300 font-light">{hist.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 font-mono py-1">
                    Lead logged. No further status changes yet.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLeadDetails}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-[#00C2CB] text-[#0B0F12] font-semibold text-xs hover:bg-cyan-300 transition-colors"
              >
                {actionLoading ? "Saving..." : "Save Lead Details"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
