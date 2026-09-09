import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import BrandStatement from "@/components/brand/BrandStatement";
import WhyInvisibleGrills from "@/components/features/WhyInvisibleGrills";
import ProductOverview from "@/components/product/ProductOverview";
import TechnicalSpecifications from "@/components/specifications/TechnicalSpecifications";
import TechnicalDiagrams from "@/components/product/TechnicalDiagrams";
import SafetyPerformance from "@/components/safety/SafetyPerformance";
import WindowTypesSection from "@/components/installations/WindowTypesSection";
import ComparisonSection from "@/components/comparison/ComparisonSection";
import ApplicationsSection from "@/components/applications/ApplicationsSection";
import VisualGallery from "@/components/gallery/VisualGallery";
import EnquiryForm from "@/components/forms/EnquiryForm";
import ContactSection from "@/components/contact/ContactSection";
import Footer from "@/components/layout/Footer";
import FloatingContact from "@/components/layout/FloatingContact";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-deccan-dark text-slate-100 selection:bg-deccan-cyan selection:text-deccan-dark">
      {/* 1. Sticky Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero */}
        <HeroSection />

        {/* 3. Brand Statement Transition */}
        <BrandStatement />

        {/* 4. Why Invisible Grills (6 Features from PDF) */}
        <WhyInvisibleGrills />

        {/* 5. Product Overview (Cable is Heart of Product) */}
        <ProductOverview />

        {/* 6. Technical Specifications (SS 316/304, 2.5/3.0mm, 400kg tension) */}
        <TechnicalSpecifications />

        {/* 7. Technical Engineering Diagrams (27mm Channel, Cable, 2.7mm Stiffener) */}
        <TechnicalDiagrams />

        {/* 8. Safety & Performance (Accidental fall prevention, Anti-rust) */}
        <SafetyPerformance />

        {/* 9. Window Installation Types (Fixed, Sliding, Bi-Fold, Casement) */}
        <WindowTypesSection />

        {/* 10. Invisible vs Traditional Grills Matrix */}
        <ComparisonSection />

        {/* 11. Visual Applications */}
        <ApplicationsSection />

        {/* 12. Visual Gallery with Lightbox */}
        <VisualGallery />

        {/* 13. Product Enquiry & Site Visit Form */}
        <EnquiryForm />

        {/* 14. Contact Section */}
        <ContactSection />
      </main>

      {/* 15. Footer */}
      <Footer />

      {/* Floating Action Buttons */}
      <FloatingContact />
    </div>
  );
}
