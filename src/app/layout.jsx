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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Anti-flash theme script — runs before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen selection:bg-deccan-cyan selection:text-deccan-dark`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
