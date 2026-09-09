export interface SiteConfig {
  name: string;
  tagline: string;
  brandStatement: {
    line1: string;
    line2: string;
  };
  phones: string[];
  displayPhone: string;
  email: string;
  instagram: string;
  instagramUrl: string;
  serviceArea: string;
  whatsappNumber: string;
  whatsappMessage: string;
}

export const siteConfig: SiteConfig = {
  name: "Deccan Space Works",
  tagline: "Safety Without Blocking Your View.",
  brandStatement: {
    line1: "WHAT'S VISIBLE ARE SEAMLESS.",
    line2: "WHAT'S INVISIBLE IS STRENGTH.",
  },
  phones: ["+91 9100720137", "+91 9390424186"],
  displayPhone: "+91 91007 20137",
  email: "Deccanspaceworks@gmail.com",
  instagram: "@deccan_space_works",
  instagramUrl: "https://instagram.com/deccan_space_works",
  serviceArea: "Hyderabad",
  whatsappNumber: "919100720137",
  whatsappMessage: "Hello Deccan Space Works, I would like to request a free site visit for Invisible Grills.",
};

export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: "Home", href: "#hero" },
  { label: "Why Us", href: "#why-us" },
  { label: "Product", href: "#product" },
  { label: "Specifications", href: "#specifications" },
  { label: "Engineering", href: "#engineering" },
  { label: "Window Types", href: "#window-types" },
  { label: "Comparison", href: "#comparison" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];
