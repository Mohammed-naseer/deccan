"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAdminDashboard } from "@/services/api";
import { 
  Users, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Wrench, 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Search, 
  Filter,
  SlidersHorizontal,
  Home
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    getAdminDashboard().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-deccan-dark flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-deccan-cyan border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">Loading Deccan Space Works Admin...</span>
        </div>
      </div>
    );
  }

  const filteredEnquiries = data.recentEnquiries.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cityArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phoneNumber.includes(searchTerm);
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-deccan-dark text-slate-200 flex flex-col">
      {/* Admin Header */}
      <header className="border-b border-white/10 bg-deccan-card sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                <Image src="/images/logo.jpg" alt="Logo" fill className="object-cover" />
              </div>
              <div>
                <span className="font-display font-bold text-white text-sm block">
                  Deccan Space Works
                </span>
                <span className="text-[10px] font-mono text-deccan-cyan block uppercase">
                  Management Console (Hyderabad)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30">
              ● Hyderabad Operations Live
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        
        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-deccan-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono">Total Enquiries</span>
              <Users className="w-4 h-4 text-deccan-cyan" />
            </div>
            <span className="font-display text-3xl font-extrabold text-white block">
              {data.metrics.totalEnquiries}
            </span>
            <span className="text-[10px] text-slate-400 block font-light">All Hyderabad Leads</span>
          </div>

          <div className="p-5 rounded-2xl bg-deccan-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono">Site Visits</span>
              <Calendar className="w-4 h-4 text-deccan-cyan" />
            </div>
            <span className="font-display text-3xl font-extrabold text-white block">
              {data.metrics.siteVisitsScheduled}
            </span>
            <span className="text-[10px] text-emerald-400 block font-light">Scheduled This Week</span>
          </div>

          <div className="p-5 rounded-2xl bg-deccan-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono">Pending Quotes</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-display text-3xl font-extrabold text-white block">
              {data.metrics.pendingQuotations}
            </span>
            <span className="text-[10px] text-amber-300 block font-light">Awaiting Estimations</span>
          </div>

          <div className="p-5 rounded-2xl bg-deccan-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono">Confirmed Orders</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-display text-3xl font-extrabold text-white block">
              {data.metrics.confirmedOrders}
            </span>
            <span className="text-[10px] text-emerald-400 block font-light">Approved by Clients</span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-5 rounded-2xl bg-deccan-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono">Active Jobs</span>
              <Wrench className="w-4 h-4 text-deccan-cyan" />
            </div>
            <span className="font-display text-3xl font-extrabold text-white block">
              {data.metrics.activeInstallations}
            </span>
            <span className="text-[10px] text-slate-400 block font-light">Field Technicians On-Site</span>
          </div>
        </div>

        {/* Lead Table Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-deccan-card border border-white/15 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                Customer Site Visit Enquiries
              </h2>
              <span className="text-xs text-slate-400 font-light">
                Manage incoming customer requests, schedule engineers, and update quote stages.
              </span>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, phone, area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-deccan-dark border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-deccan-cyan"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-deccan-dark border border-white/10 text-xs text-white focus:outline-none focus:border-deccan-cyan"
              >
                <option value="All">All Statuses</option>
                <option value="Enquiry Received">Enquiry Received</option>
                <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                <option value="Measurement Completed">Measurement Completed</option>
                <option value="Quotation Prepared">Quotation Prepared</option>
              </select>
            </div>
          </div>

          {/* Enquiries Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-deccan-dark/80 border-b border-white/10 text-slate-400 font-mono uppercase tracking-wider">
                  <th className="p-4">Customer & Phone</th>
                  <th className="p-4">Locality / Area</th>
                  <th className="p-4">Property & Type</th>
                  <th className="p-4">Visit Preference</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEnquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-white block">{enq.name}</span>
                      <span className="text-slate-400 font-mono text-[11px] block">{enq.phoneNumber}</span>
                    </td>
                    <td className="p-4 text-slate-300 font-light">{enq.cityArea}</td>
                    <td className="p-4">
                      <span className="text-white block font-medium">{enq.propertyType}</span>
                      <span className="text-slate-400 text-[11px] block">{enq.windowType} ({enq.approximateWindows})</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white block">{enq.preferredVisitDate}</span>
                      <span className="text-slate-400 text-[11px] block">{enq.preferredTime}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-semibold inline-block ${
                        enq.status === "Site Visit Scheduled"
                          ? "bg-blue-950/60 border border-blue-500/40 text-blue-300"
                          : enq.status === "Measurement Completed"
                          ? "bg-purple-950/60 border border-purple-500/40 text-purple-300"
                          : enq.status === "Quotation Prepared"
                          ? "bg-amber-950/60 border border-amber-500/40 text-amber-300"
                          : "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                      }`}>
                        {enq.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:${enq.phoneNumber}`}
                          className="p-1.5 rounded-lg bg-deccan-dark border border-white/10 hover:border-deccan-cyan/40 text-slate-300 hover:text-white"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${enq.whatsappNumber.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40"
                          title="WhatsApp Customer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}
