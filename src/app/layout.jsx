import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { themeScript } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://deccanspaceworks.com"),
  title: "Deccan Space Works | Invisible Grills in Hyderabad",
  description:
    "Deccan Space Works provides invisible grill solutions for balconies and windows in Hyderabad, with stainless steel wire options, aluminium track systems and professional installation.",
  keywords: [
    "Invisible Grills Hyderabad",
    "Deccan Space Works",
    "Balcony Invisible Grills",
    "Window Invisible Grills",
    "SS 316 Invisible Grills",
    "SS 304 Invisible Grills",
    "Safety Grills Hyderabad",
    "400kg tension load grills",
  ],
  authors: [{ name: "Deccan Space Works" }],
  creator: "Deccan Space Works",
  alternates: {
    canonical: "https://deccanspaceworks.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://deccanspaceworks.com",
    title: "Deccan Space Works | Invisible Grills in Hyderabad",
    description:
      "Safety Without Blocking Your View. Premium invisible grill solutions with SS 316 & SS 304 wire, heavy-duty aluminium tracks, tested up to 400kg tension load in Hyderabad.",
    siteName: "Deccan Space Works",
    images: [
      {
        url: "/images/hero_balcony.jpg",
        width: 1200,
        height: 630,
        alt: "Deccan Space Works Invisible Grills Installation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deccan Space Works | Invisible Grills in Hyderabad",
    description: "Safety Without Blocking Your View. Invisible Grills for balconies and windows in Hyderabad.",
    images: ["/images/hero_balcony.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: "Deccan Space Works",
  alternateName: "Deccan Space Works Invisible Grills",
  url: "https://deccanspaceworks.com",
  logo: "https://deccanspaceworks.com/images/logo.jpg",
  image: "https://deccanspaceworks.com/images/hero_balcony.jpg",
  description:
    "Professional invisible grill installation services for balconies and windows in Hyderabad, India. Premium SS 316 and SS 304 marine grade cables tested to 400kg tension.",
  telephone: "+919100720137",
  email: "Deccanspaceworks@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "17.3850",
    longitude: "78.4867",
  },
  areaServed: [
    {
      "@type": "City",
      name: "Hyderabad",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Anti-flash theme script — runs before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen selection:bg-deccan-cyan selection:text-deccan-dark`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-deccan-cyan focus:text-deccan-dark focus:font-bold focus:rounded-lg focus:shadow-xl focus:outline-none"
        >
          Skip to main content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
