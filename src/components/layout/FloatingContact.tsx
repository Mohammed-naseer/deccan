"use client";

import { siteConfig } from "@/config/site";
import { MessageSquare, Phone } from "lucide-react";

export default function FloatingContact() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
          siteConfig.whatsappMessage
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-2xl shadow-emerald-950/80 transition-all hover:scale-105 group border border-emerald-400/40"
      >
        <MessageSquare className="w-4 h-4 fill-current" />
        <span className="hidden sm:inline font-mono">Chat on WhatsApp</span>
      </a>

      {/* Direct Call Button */}
      <a
        href={`tel:${siteConfig.phones[0]}`}
        aria-label="Direct Phone Call"
        className="flex items-center justify-center w-12 h-12 rounded-full bg-deccan-card hover:bg-deccan-dark text-deccan-cyan border border-deccan-cyan/40 shadow-xl transition-all hover:scale-105"
      >
        <Phone className="w-5 h-5" />
      </a>
    </div>
  );
}
