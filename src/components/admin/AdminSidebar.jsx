"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  LayoutDashboard,
  MessageSquare,
  CalendarCheck,
  PhoneCall,
  Package,
  Image as ImageIcon,
  Video,
  Quote,
  FileText,
  MapPin,
  FolderOpen,
  Settings,
  History,
  LogOut,
  X,
  ExternalLink,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { name: "Site Visits", href: "/admin/site-visits", icon: CalendarCheck },
  { name: "Contact Enquiries", href: "/admin/contacts", icon: PhoneCall },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Gallery", href: "/admin/gallery", icon: ImageIcon },
  { name: "Videos", href: "/admin/videos", icon: Video },
  { name: "Testimonials", href: "/admin/testimonials", icon: Quote },
  { name: "Website Content", href: "/admin/content", icon: FileText },
  { name: "Service Areas", href: "/admin/service-areas", icon: MapPin },
  { name: "Media Library", href: "/admin/media", icon: FolderOpen },
  { name: "Activity Logs", href: "/admin/activity", icon: History },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { logout, admin } = useAdminAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B0F12] border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20">
              <Image src="/images/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm block">
                Deccan Space Works
              </span>
              <span className="text-[10px] font-mono text-[#00C2CB] block uppercase tracking-wider">
                Management Portal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin" || pathname === "/admin/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#00C2CB]/15 text-[#00C2CB] border border-[#00C2CB]/30 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#00C2CB]" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Public Website Link & Logout */}
        <div className="p-4 border-t border-white/10 space-y-2 bg-[#12181F]/40">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#00C2CB]" />
              <span>Public Website</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Live</span>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
