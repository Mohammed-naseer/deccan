"use client";

import { useState, useEffect } from "react";
import { getAdminActivityLogs } from "@/services/api";
import { History, ShieldCheck, UserCheck, RefreshCw, FileText, CheckCircle2 } from "lucide-react";

export default function AdminActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAdminActivityLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Admin Activity &amp; Audit Logs
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Comprehensive audit trail of administrator actions, reviews approved, site visits scheduled, and content modified.
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

      <div className="bg-[#12181F] border border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading activity audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs">
            No administrator activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div
                key={log._id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{log.adminEmail}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#00C2CB]/10 text-[#00C2CB] border border-[#00C2CB]/20">
                      {log.action} · {log.entity}
                    </span>
                  </div>
                  <p className="text-slate-400 font-light">{log.details || `Performed ${log.action} on ${log.entity}`}</p>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
