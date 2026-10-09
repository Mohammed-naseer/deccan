"use client";

import { useState, useEffect } from "react";
import { getAdminServiceAreas, createAdminServiceArea, updateAdminServiceArea, deleteAdminServiceArea } from "@/services/api";
import { MapPin, Plus, Trash2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function AdminServiceAreasPage() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAreaName, setNewAreaName] = useState("");
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminServiceAreas();
      setAreas(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    try {
      await createAdminServiceArea({
        name: newAreaName.trim(),
        district: "Hyderabad",
        isActive: true,
        displayOrder: areas.length + 1,
      });
      setNewAreaName("");
      setMsg("Service area added.");
      loadData();
    } catch (err) {
      alert("Failed to add area.");
    }
  };

  const handleToggle = async (area) => {
    try {
      await updateAdminServiceArea(area._id, { isActive: !area.isActive });
      setMsg(`Updated ${area.name}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this service area?")) return;
    try {
      await deleteAdminServiceArea(id);
      setMsg("Area removed.");
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
            Hyderabad Service Areas
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Manage localities where Deccan Space Works provides free site inspection and invisible grill installations.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-2 border border-white/10"
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

      {/* Add New Area Input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Enter new Hyderabad area (e.g. Narsingi, Bandlaguda, Bachupally)..."
          value={newAreaName}
          onChange={(e) => setNewAreaName(e.target.value)}
          className="flex-1 bg-[#12181F] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00C2CB]"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] font-semibold text-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Area</span>
        </button>
      </form>

      {/* Areas Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {areas.map((area) => (
          <div
            key={area._id || area.name}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
              area.isActive
                ? "bg-[#12181F] border-white/10"
                : "bg-white/[0.02] border-dashed border-white/5 opacity-60"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#00C2CB]/10 border border-[#00C2CB]/30 flex items-center justify-center text-[#00C2CB] flex-shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-white truncate">{area.name}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggle(area)}
                title={area.isActive ? "Deactivate" : "Activate"}
                className="p-1 text-slate-400 hover:text-white"
              >
                {area.isActive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
              <button
                onClick={() => handleDelete(area._id)}
                className="p-1 text-slate-500 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
