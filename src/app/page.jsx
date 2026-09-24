import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import HomeServicesSection from "@/components/services/HomeServicesSection";
import TrustSection from "@/components/trust/TrustSection";
import BrandStatement from "@/components/brand/BrandStatement";
import WhyInvisibleGrills from "@/components/features/WhyInvisibleGrills";
import ProductOverview from "@/components/product/ProductOverview";
import TechnicalSpecifications from "@/components/specifications/TechnicalSpecifications";
import TechnicalDiagrams from "@/components/product/TechnicalDiagrams";
import SafetyPerformance from "@/components/safety/SafetyPerformance";
import WindowTypesSection from "@/components/installations/WindowTypesSection";
import ComparisonSection from "@/components/comparison/ComparisonSection";
import ApplicationsSection from "@/components/applications/ApplicationsSection";
import ExploreSection from "@/components/explore/ExploreSection";
import VisualGallery from "@/components/gallery/VisualGallery";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import WhatsAppCTABanner from "@/components/cta/WhatsAppCTABanner";
import EnquiryForm from "@/components/forms/EnquiryForm";
import ServiceAreasSection from "@/components/areas/ServiceAreasSection";
import ContactSection from "@/components/contact/ContactSection";
import Footer from "@/components/layout/Footer";
import FloatingContact from "@/components/layout/FloatingContact";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-deccan-dark text-slate-100 selection:bg-deccan-cyan selection:text-deccan-dark">
      {/* 1. Sticky Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section (Smart & Stylish Solutions) */}
        <HeroSection />

        {/* 3. Complete Home Solutions (6 Product Cards) */}
        <HomeServicesSection />

        {/* 4. Trust / Why Choose Us Section */}
        <TrustSection />

        {/* 5. Brand Statement Transition */}
        <BrandStatement />

        {/* 6. Why Invisible Grills (6 Features from PDF) */}
        <WhyInvisibleGrills />

        {/* 7. Product Overview (Cable is Heart of Product) */}
        <ProductOverview />

        {/* 8. Technical Specifications (SS 316/304, 2.5/3.0mm, 400kg tension) */}
        <TechnicalSpecifications />

        {/* 9. Technical Engineering Diagrams (27mm Channel, Cable, 2.7mm Stiffener) */}
        <TechnicalDiagrams />

        {/* 10. Safety & Performance (Accidental fall prevention, Anti-rust) */}
        <SafetyPerformance />

        {/* 11. Window Installation Types (Fixed, Sliding, Bi-Fold, Casement) */}
        <WindowTypesSection />

        {/* 12. Invisible vs Traditional Grills Matrix */}
        <ComparisonSection />

        {/* 13. Visual Applications */}
        <ApplicationsSection />

        {/* 14. Explore - Video Showcase */}
        <ExploreSection />

        {/* 15. Visual Gallery with Lightbox */}
        <VisualGallery />

        {/* 16. Customer Reviews & Feedback */}
        <ReviewsSection />

        {/* 17. WhatsApp & Call CTA Banner */}
        <WhatsAppCTABanner />

        {/* 18. Product Enquiry & Free Site Visit Form */}
        <EnquiryForm />

        {/* 19. Service Areas Section (All Over Hyderabad) */}
        <ServiceAreasSection />

        {/* 20. Direct Contact Section */}
        <ContactSection />
      </main>

      {/* 21. Footer */}
      <Footer />

      {/* Floating Action Buttons */}
      <FloatingContact />
    </div>
  );
}
