import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowUpRight, Phone, Mail, MapPin } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";

export default function Footer() {
  return (
    <footer className="bg-black/90 border-t border-white/10 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand & Logo */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/20">
                <Image
                  src="/images/logo.jpg"
                  alt="Deccan Space Works"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <span className="font-display font-extrabold text-white text-lg tracking-wider block">
                  DECCAN SPACE WORKS
                </span>
                <span className="text-[11px] font-mono text-deccan-cyan tracking-widest uppercase block">
                  Invisible Grills
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-light leading-relaxed max-w-sm">
              &ldquo;What&apos;s visible are seamless. What&apos;s invisible is strength.&rdquo; Engineered high-tensile invisible grill installations for balconies and windows across Hyderabad.
            </p>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <MapPin className="w-4 h-4 text-deccan-cyan" />
              <span>Hyderabad, Telangana</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold block">
              Quick Links
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#hero" className="hover:text-deccan-cyan transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#why-us" className="hover:text-deccan-cyan transition-colors">
                  Why Invisible Grills
                </Link>
              </li>
              <li>
                <Link href="#product" className="hover:text-deccan-cyan transition-colors">
                  Product Overview
                </Link>
              </li>
              <li>
                <Link href="#specifications" className="hover:text-deccan-cyan transition-colors">
                  Specifications
                </Link>
              </li>
              <li>
                <Link href="#engineering" className="hover:text-deccan-cyan transition-colors">
                  Technical CAD Schematics
                </Link>
              </li>
              <li>
                <Link href="#gallery" className="hover:text-deccan-cyan transition-colors">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-deccan-cyan transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Services / Product References from Brand Logo */}
          <div className="lg:col-span-3 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold block">
              Services & Products
            </span>
            <ul className="space-y-2 text-xs">
              <li className="text-deccan-cyan font-medium flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-deccan-cyan" />
                <span>Invisible Grills (Flagship Product)</span>
              </li>
              <li className="hover:text-white transition-colors flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>Cloth Hangers</span>
              </li>
              <li className="hover:text-white transition-colors flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>Mosquito Mesh</span>
              </li>
              <li className="pt-2">
                <span className="text-[11px] text-slate-500 block">
                  Future Portal Access:
                </span>
                <div className="flex gap-2 mt-1">
                  <Link
                    href="/customer/dashboard"
                    className="text-[11px] text-deccan-cyan hover:underline"
                  >
                    Customer Portal →
                  </Link>
                  <span className="text-slate-600">·</span>
                  <Link
                    href="/admin/dashboard"
                    className="text-[11px] text-deccan-cyan hover:underline"
                  >
                    Admin Portal →
                  </Link>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Contacts */}
          <div className="lg:col-span-3 space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold block">
              Official Contact
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-deccan-cyan" />
                <span className="text-slate-200">+91 9100720137</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-deccan-cyan" />
                <span className="text-slate-200">+91 9390424186</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-deccan-cyan" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {siteConfig.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <InstagramIcon className="w-3.5 h-3.5 text-purple-400" />
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {siteConfig.instagram}
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 text-center sm:text-left">
          <p>© 2026 Deccan Space Works. All rights reserved. Hyderabad, Telangana.</p>
          <p className="font-mono text-[10px] sm:text-[11px]">
            &ldquo;WHAT&apos;S VISIBLE ARE SEAMLESS. WHAT&apos;S INVISIBLE IS STRENGTH.&rdquo;
          </p>
        </div>

      </div>
    </footer>
  );
}
