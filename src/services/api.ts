import { SiteVisitEnquiry, CustomerPortalData, AdminDashboardData } from "@/types";
import { technicalSpecs, windowInstallationTypes, galleryItems } from "@/data/productData";
import { mockCustomerData, mockAdminData } from "@/data/mockPortalData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Service layer abstraction for Deccan Space Works
 * When NEXT_PUBLIC_API_BASE_URL is defined, can call real backend APIs.
 * Defaults gracefully to typed mock data and simulated async latency.
 */

export async function getProduct() {
  return {
    brand: "Deccan Space Works",
    product: "Invisible Grills",
    headline: "Safety Without Blocking Your View.",
    brandStatement: {
      line1: "WHAT'S VISIBLE ARE SEAMLESS.",
      line2: "WHAT'S INVISIBLE IS STRENGTH.",
    },
    wireThicknessOptions: ["2.5 mm", "3.0 mm"],
    materialGrades: ["SS 316", "SS 304"],
    tensionLoadCapacity: "Up to 400 kg tension load",
  };
}

export async function getSpecifications() {
  return technicalSpecs;
}

export async function getWindowTypes() {
  return windowInstallationTypes;
}

export async function getGallery() {
  return galleryItems;
}

export async function createEnquiry(enquiry: SiteVisitEnquiry): Promise<{ success: boolean; id: string; message: string }> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enquiry),
    });
    return res.json();
  }

  // Simulated latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    id: `DSW-HYD-${Math.floor(1000 + Math.random() * 9000)}`,
    message: "Thank you! Your site visit request has been received. Our team will contact you promptly.",
  };
}

export async function getCustomerEnquiry(id?: string): Promise<CustomerPortalData> {
  if (API_BASE_URL && id) {
    const res = await fetch(`${API_BASE_URL}/api/customer/${id}`);
    return res.json();
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCustomerData;
}

export async function getCustomerQuotation(id?: string) {
  const data = await getCustomerEnquiry(id);
  return data.quotation;
}

export async function getCustomerStatus(id?: string) {
  const data = await getCustomerEnquiry(id);
  return {
    currentStep: data.currentStep,
    totalSteps: data.totalSteps,
    steps: data.steps,
  };
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`);
    return res.json();
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockAdminData;
}
