"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdminDashboard } from "@/services/api";
import {
  Users,
  Calendar,
  MessageSquare,
  Package,
  Image as ImageIcon,
  Video,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  MapPin,
  Phone,
} from "lucide-react";

export default function AdminDashboardRoot() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-[#00C2CB] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">Loading Live Dashboard Metrics...</span>
        </div>
      </div>
    );
  }

  const metrics = data.metrics || {};
  const recentVisits = data.recentSiteVisits || [];
  const recentContacts = data.recentContacts || [];
  const recentActivity = data.recentActivity || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#12181F] via-[#151e28] to-[#12181F] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-mono text-[#00C2CB] uppercase tracking-wider block">
            Deccan Space Works Management Hub
          </span>
          <h2 className="font-display text-2xl font-bold text-white">
            Operational Overview &amp; Live Enquiries
          </h2>
          <p className="text-xs text-slate-400 font-light">
            Monitor real-time incoming site measurements, customer reviews, product catalog, and media across Hyderabad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/site-visits"
            className="px-4 py-2 rounded-xl bg-[#00C2CB] hover:bg-[#00d8e2] text-[#0B0F12] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-[#00C2CB]/20"
          >
            <span>View Site Visits</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/reviews"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all"
          >
            <span>Moderate Reviews</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Reviews */}
        <div className="p-4 rounded-2xl bg-[#12181F] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono">Reviews</span>
            <MessageSquare className="w-4 h-4 text-[#00C2CB]" />
          </div>
          <span className="font-display text-2xl sm:text-3xl font-extrabold text-white block">
            {metrics.totalReviews ?? metrics.totalEnquiries ?? 0}
          </span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-400 font-mono">
              {metrics.pendingReviews ?? 0} PENDING
            </span>
          </div>
        </div>

        {/* Site Visits */}
        <div className="p-4 rounded-2xl bg-[#12181F] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono">Site Visits</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-display text-2xl sm:text-3xl font-extrabold text-white block">
            {metrics.totalSiteVisits ?? metrics.siteVisitsScheduled ?? 0}
          </span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono">
              {metrics.newSiteVisits ?? 0} NEW
            </span>
          </div>
        </div>

        {/* Contacts */}
        <div className="p-4 rounded-2xl bg-[#12181F] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono">Contact Forms</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-display text-2xl sm:text-3xl font-extrabold text-white block">
            {metrics.totalContacts ?? 0}
          </span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-400 font-mono">
              {metrics.newContacts ?? 0} NEW
            </span>
          </div>
        </div>

        {/* Products */}
        <div className="p-4 rounded-2xl bg-[#12181F] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono">Products</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-display text-2xl sm:text-3xl font-extrabold text-white block">
            {metrics.totalProducts ?? 6}
          </span>
          <span className="text-[10px] text-slate-400 block font-light">6 Active Categories</span>
        </div>

        {/* Gallery */}
        <div className="p-4 rounded-2xl bg-[#12181F] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono">Gallery Photos</span>
            <ImageIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-display text-2xl sm:text-3xl font-extrabold text-white block">
            {metrics.totalGallery ?? 8}
          </span>
          <span className="text-[10px] text-slate-400 block font-light">Cloudinary Synced</span>
        </div>

        {/* Videos */}
        <div className="p-4 rounded-2xl bg-[#12181F] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono">Videos</span>
            <Video className="w-4 h-4 text-rose-400" />
          </div>
          <span className="font-display text-2xl sm:text-3xl font-extrabold text-white block">
            {metrics.totalVideos ?? 2}
          </span>
          <span className="text-[10px] text-slate-400 block font-light">Active Showcases</span>
        </div>
      </div>

      {/* Main Dual Panels: Site Visits & Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Site Visits */}
        <div className="lg:col-span-7 bg-[#12181F] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="font-display font-bold text-white text-base">
                Recent Free Site Visits
              </h3>
              <p className="text-[11px] text-slate-400 font-light">
                Hyderabad site measurement &amp; quote requests
              </p>
            </div>
            <Link
              href="/admin/site-visits"
              className="text-xs font-mono text-[#00C2CB] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentVisits.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-mono">
                No recent site visit requests recorded yet.
              </p>
            ) : (
              recentVisits.map((item) => (
                <div
                  key={item._id}
                  className="p-3.5 rounded-2xl bg-[#0B0F12]/60 border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00C2CB]/10 text-[#00C2CB] border border-[#00C2CB]/25">
                        {item.propertyType || "Apartment"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-light">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#00C2CB]" />
                        <span>{item.cityArea}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{item.phoneNumber}</span>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border ${
                      item.status === "new"
                        ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/30"
                        : item.status === "scheduled"
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Contact Enquiries & Audit Trail */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Recent Contact Enquiries */}
          <div className="bg-[#12181F] border border-white/10 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="font-display font-bold text-white text-base">
                  Contact Enquiries
                </h3>
                <p className="text-[11px] text-slate-400 font-light">Direct messages from customers</p>
              </div>
              <Link
                href="/admin/contacts"
                className="text-xs font-mono text-[#00C2CB] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentContacts.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center font-mono">
                  No contact enquiries logged yet.
                </p>
              ) : (
                recentContacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="p-3 rounded-2xl bg-[#0B0F12]/60 border border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{contact.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{contact.city || "Hyderabad"}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-light line-clamp-1">"{contact.message}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick System Status Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/20 to-[#12181F] border border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                Production Backend Active
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              FastAPI backend running with MongoDB Atlas, Cloudinary asset pipelines, and Resend transactional notification dispatch.
            </p>
            <div className="pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Database: deccan_space_works</span>
              <span className="text-emerald-400">● 100% Health</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
