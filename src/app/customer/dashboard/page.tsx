"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCustomerEnquiry } from "@/services/api";
import { CustomerPortalData } from "@/types";
import { CheckCircle2, Clock, Calendar, User, Phone, MapPin, FileText, ArrowLeft, Shield } from "lucide-react";

export default function CustomerDashboardPage() {
  const [data, setData] = useState<CustomerPortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerEnquiry().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-deccan-dark flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-deccan-cyan border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">Loading Customer Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deccan-dark text-slate-200">
      {/* Top Bar */}
      <header className="border-b border-white/10 bg-deccan-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Website</span>
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
                  Customer Tracking Portal
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-slate-400 block">Enquiry ID</span>
            <span className="text-xs font-mono font-bold text-deccan-cyan">{data.enquiryId}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Customer Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-deccan-card border border-white/15 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-1">
                Active Project Tracking
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {data.customerName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-deccan-cyan" />
                  {data.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-deccan-cyan" />
                  {data.propertyType}
                </span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-deccan-dark border border-deccan-cyan/40 text-right">
              <span className="text-[10px] font-mono text-slate-400 block">Current Status</span>
              <span className="text-xs font-mono font-bold text-deccan-cyan">
                {data.steps.find((s) => s.current)?.title || "In Progress"}
              </span>
            </div>
          </div>
        </div>

        {/* 8-Stage Progress Timeline */}
        <div className="p-6 sm:p-8 rounded-3xl bg-deccan-card/60 border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white">
              Installation & Delivery Journey
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Stage {data.currentStep} of {data.totalSteps}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.steps.map((step, idx) => (
              <div
                key={step.title}
                className={`p-4 rounded-2xl border transition-all ${
                  step.completed
                    ? "bg-emerald-950/20 border-emerald-500/40 text-white"
                    : step.current
                    ? "bg-deccan-cyan/10 border-deccan-cyan text-white shadow-md shadow-deccan-cyan/10"
                    : "bg-deccan-dark/60 border-white/5 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Stage 0{idx + 1}
                  </span>
                  {step.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : step.current ? (
                    <Clock className="w-4 h-4 text-deccan-cyan animate-pulse" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                  )}
                </div>
                <h3 className="font-display font-bold text-sm text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 font-light mt-1">{step.description}</p>
                {step.date && (
                  <span className="text-[10px] font-mono text-deccan-cyan block mt-2">
                    {step.date}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Two Columns: Site Visit Info & Quotation Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Site Visit Card */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-deccan-card/60 border border-white/10 space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block">
              Site Visit Assignment
            </span>
            <h3 className="font-display font-bold text-xl text-white">
              Field Engineer Details
            </h3>

            <div className="p-4 rounded-2xl bg-deccan-dark border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned Engineer:</span>
                <span className="text-white font-medium">{data.siteVisit.engineerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Scheduled Date:</span>
                <span className="text-white font-medium">{data.siteVisit.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Time Window:</span>
                <span className="text-white font-medium">{data.siteVisit.timeSlot}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contact Number:</span>
                <a href={`tel:${data.siteVisit.engineerPhone}`} className="text-deccan-cyan hover:underline">
                  {data.siteVisit.engineerPhone}
                </a>
              </div>
            </div>

            {/* Captured Measurements Preview */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Recorded Openings ({data.measurements?.length || 0}):
              </span>
              <div className="space-y-2">
                {data.measurements?.map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-deccan-dark/70 border border-white/5 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-white font-medium block">{m.location}</span>
                      <span className="text-[11px] text-slate-400">{m.orientation} · {m.wireSpacing}</span>
                    </div>
                    <span className="font-mono text-deccan-cyan font-bold">{m.dimensions}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quotation Preview Card */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-deccan-card/60 border border-white/10 space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block">
              Quotation Review
            </span>
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-xl text-white">
                Technical Specification Summary
              </h3>
              <span className="text-xs font-mono text-deccan-cyan bg-deccan-cyan/10 px-2.5 py-1 rounded border border-deccan-cyan/20">
                {data.quotation?.quoteNumber}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-deccan-dark border border-white/10 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/10">
                <div>
                  <span className="text-slate-400 block text-[11px]">Wire Specification:</span>
                  <span className="text-white font-medium">{data.quotation?.wireSpec}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Material Grade:</span>
                  <span className="text-white font-medium">{data.quotation?.materialGrade}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/10">
                <div>
                  <span className="text-slate-400 block text-[11px]">Track System:</span>
                  <span className="text-white font-medium">{data.quotation?.trackSystem}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Approx Total Area:</span>
                  <span className="text-white font-medium">{data.quotation?.approxAreaSqFt} sq. ft.</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Engineering Notes:</span>
                <span className="text-slate-300 font-light">{data.quotation?.notes}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={`https://wa.me/919100720137?text=Hello%20Deccan%20Space%20Works,%20I%20have%20a%20question%20regarding%20my%20enquiry%20${data.enquiryId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs text-center transition-all"
              >
                Discuss Quotation on WhatsApp
              </a>
              <a
                href="tel:+919100720137"
                className="px-5 py-3 rounded-xl bg-deccan-card border border-white/15 text-slate-200 hover:text-white text-xs text-center transition-all"
              >
                Call Support (+91 9100720137)
              </a>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
