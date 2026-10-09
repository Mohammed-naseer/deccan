"use client";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { Menu, Bell, ShieldCheck, User } from "lucide-react";

export default function AdminTopbar({ onOpenSidebar, title }) {
  const { admin } = useAdminAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F12]/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl bg-[#12181F] border border-white/10 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-white text-lg sm:text-xl">
            {title || "Management Console"}
          </h1>
          <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Hyderabad Operations Live · Fast &amp; Secure
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live operational badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>MongoDB Atlas Connected</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#12181F] border border-white/10">
          <div className="w-7 h-7 rounded-lg bg-[#00C2CB]/20 border border-[#00C2CB]/40 flex items-center justify-center text-[#00C2CB] text-xs font-bold">
            {admin?.name ? admin.name[0].toUpperCase() : "A"}
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-medium text-white block leading-tight">
              {admin?.name || "Administrator"}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono capitalize">
              {admin?.role || "Superadmin"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
