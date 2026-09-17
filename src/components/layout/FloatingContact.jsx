"use client";

import { siteConfig } from "@/config/site";
import { MessageSquare, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";

export default function FloatingContact() {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 sm:gap-3">
      {/* Instagram DM Button */}
      <a
        href={siteConfig.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Instagram"
        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-medium text-xs shadow-2xl shadow-pink-950/60 transition-all hover:scale-105 border border-pink-400/30"
      >
        <InstagramIcon className="w-4 h-4" />
        <span className="hidden sm:inline font-mono">Chat on Instagram</span>
      </a>

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
          siteConfig.whatsappMessage
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-2xl shadow-emerald-950/80 transition-all hover:scale-105 border border-emerald-400/40"
      >
        <MessageSquare className="w-4 h-4 fill-current" />
        <span className="hidden sm:inline font-mono">Chat on WhatsApp</span>
      </a>

      {/* Direct Call Button */}
      <a
        href={`tel:${siteConfig.phones[0]}`}
        aria-label="Direct Phone Call"
        className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-deccan-card hover:bg-deccan-dark text-deccan-cyan border border-deccan-cyan/40 shadow-xl transition-all hover:scale-105"
      >
        <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
      </a>
    </div>
  );
}
