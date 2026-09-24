"use client";

import { useState, useEffect } from "react";
import { getAdminContacts, updateContactStatus, deleteContact } from "@/services/api";
import { Phone, Mail, MapPin, Search, RefreshCw, Trash2, CheckCircle2, MessageSquare, X } from "lucide-react";

const STATUSES = ["All", "new", "contacted", "in-progress", "resolved", "closed"];

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [notes, setNotes] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminContacts(statusFilter, searchTerm);
      setContacts(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateContactStatus(id, status);
      setMsg(`Contact enquiry marked as ${status}.`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedContact) return;
    try {
      await updateContactStatus(selectedContact._id, selectedContact.status, notes);
      setMsg("Internal note saved.");
      loadData();
      setSelectedContact(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteContact(id);
      setDeleteConfirmId(null);
      setMsg("Enquiry deleted.");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = contacts.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.phone?.includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.message?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Contact Enquiries
          </h2>
          <p className="text-xs text-slate-400 font-light">
            All general enquiries and messages sent through the Deccan Space Works contact section.
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or message..."
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

      {/* Enquiries Grid */}
      <div className="bg-[#12181F] border border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading enquiries...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">No enquiries found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white text-sm">{item.name}</span>
                    <span className="text-[11px] font-mono text-[#00C2CB]">
                      [{item.service || "General Enquiry"}]
                    </span>
                    <span className="text-[11px] text-slate-400">· {item.city || "Hyderabad"}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <a href={`tel:${item.phone}`} className="hover:underline text-white">
                        {item.phone}
                      </a>
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <a href={`mailto:${item.email}`} className="hover:underline">
                        {item.email}
                      </a>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-light bg-[#0B0F12]/60 p-3 rounded-xl border border-white/5">
                    "{item.message}"
                  </p>

                  {item.adminNotes && (
                    <div className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-500/20 px-3 py-1.5 rounded-lg font-mono">
                      Note: {item.adminNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    className="text-xs font-mono uppercase px-2.5 py-1.5 rounded-xl border border-white/15 bg-[#0B0F12] text-slate-200 focus:outline-none"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedContact(item);
                      setNotes(item.adminNotes || "");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono border border-white/10"
                  >
                    Note
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

      {/* Internal Note Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#12181F] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-base">
                Internal Note: {selectedContact.name}
              </h3>
              <button onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes on customer discussion..."
              className="w-full bg-[#0B0F12] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2CB]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedContact(null)}
                className="px-3 py-1.5 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl bg-[#00C2CB] text-[#0B0F12] font-semibold text-xs"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
