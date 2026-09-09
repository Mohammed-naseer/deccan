"use client";

import { siteConfig } from "@/config/site";
import { Phone, Mail, MapPin, MessageSquare, ArrowUpRight } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";

export default function ContactSection() {
  return (
    <section id="contact" className="py-24 bg-deccan-dark relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-deccan-cyan/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block mb-2">
            Get In Touch
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Contact Deccan Space Works
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4 font-light leading-relaxed">
            Direct communication channels for site visits, technical queries, architectural specifications, and quotes in Hyderabad.
          </p>
        </div>

        {/* 4 Contact Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* Call Us */}
          <div className="p-8 rounded-2xl bg-deccan-card/70 border border-white/10 hover:border-deccan-cyan/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Call Us
              </span>
              <div className="space-y-1 mt-2">
                {siteConfig.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone}`}
                    className="font-display font-bold text-white text-base block hover:text-deccan-cyan transition-colors"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>
            <a
              href={`tel:${siteConfig.phones[0]}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-deccan-cyan hover:underline pt-2"
            >
              <span>Call Direct</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* WhatsApp */}
          <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/50 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                WhatsApp Chat
              </span>
              <span className="font-display font-bold text-white text-base block mt-2">
                +91 91007 20137
              </span>
              <span className="text-xs text-slate-400 font-light block mt-1">
                Fast responses for quotes & photos
              </span>
            </div>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
                siteConfig.whatsappMessage
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline pt-2"
            >
              <span>Open WhatsApp</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Email */}
          <div className="p-8 rounded-2xl bg-deccan-card/70 border border-white/10 hover:border-deccan-cyan/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Email Us
              </span>
              <a
                href={`mailto:${siteConfig.email}`}
                className="font-display font-bold text-white text-sm block mt-2 hover:text-deccan-cyan transition-colors break-all"
              >
                {siteConfig.email}
              </a>
              <span className="text-xs text-slate-400 font-light block mt-1">
                Architectural drawings & tenders
              </span>
            </div>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-deccan-cyan hover:underline pt-2"
            >
              <span>Send Email</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Social / Instagram */}
          <div className="p-8 rounded-2xl bg-deccan-card/70 border border-white/10 hover:border-deccan-cyan/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <InstagramIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Follow On Social
              </span>
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display font-bold text-white text-base block mt-2 hover:text-purple-400 transition-colors"
              >
                {siteConfig.instagram}
              </a>
              <span className="text-xs text-slate-400 font-light block mt-1">
                Installation stories & video reels
              </span>
            </div>
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:underline pt-2"
            >
              <span>View Profile</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Primary Service Area Banner */}
        <div className="p-8 rounded-3xl bg-deccan-card border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-deccan-cyan/10 border border-deccan-cyan/30 flex items-center justify-center text-deccan-cyan flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-deccan-cyan block">
                Primary Service Area
              </span>
              <h3 className="font-display text-2xl font-extrabold text-white">
                HYDERABAD & Surrounding Telangana Regions
              </h3>
              <p className="text-xs text-slate-400 font-light mt-1">
                Gachibowli · Jubilee Hills · Banjara Hills · Hitec City · Kondapur · Kokapet · Madhapur · Manikonda · Tellapur
              </p>
            </div>
          </div>

          <a
            href="#enquiry"
            className="px-6 py-3.5 rounded-xl bg-deccan-cyan text-deccan-dark font-display font-bold text-sm hover:bg-cyan-300 transition-all flex-shrink-0"
          >
            Request Site Visit in Hyderabad
          </a>
        </div>

      </div>
    </section>
  );
}
