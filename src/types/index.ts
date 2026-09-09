export type PropertyType =
  | "Apartment"
  | "Villa"
  | "Independent House"
  | "Office"
  | "Other";

export type WindowTypeOption =
  | "Fixed Window"
  | "Sliding Window"
  | "Bi-Fold Window"
  | "Casement Window"
  | "Balcony"
  | "Not Sure";

export interface SiteVisitEnquiry {
  id?: string;
  name: string;
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  cityArea: string;
  propertyType: PropertyType;
  windowType: WindowTypeOption;
  approximateWindows: string;
  preferredVisitDate: string;
  preferredTime: string;
  requirementDetails: string;
  uploadedPhotoNames?: string[];
  status?:
    | "Enquiry Received"
    | "Site Visit Scheduled"
    | "Measurement Completed"
    | "Quotation Prepared"
    | "Quotation Sent"
    | "Customer Approval"
    | "Installation Scheduled"
    | "Installation Completed";
  createdAt?: string;
}

export interface CustomerPortalData {
  enquiryId: string;
  customerName: string;
  propertyType: string;
  location: string;
  windowType: string;
  approxWindows: string;
  currentStep: number;
  totalSteps: number;
  steps: {
    title: string;
    description: string;
    date?: string;
    completed: boolean;
    current?: boolean;
  }[];
  siteVisit: {
    date: string;
    timeSlot: string;
    engineerName: string;
    engineerPhone: string;
    status: string;
  };
  quotation?: {
    quoteNumber: string;
    wireSpec: string;
    materialGrade: string;
    trackSystem: string;
    approxAreaSqFt: number;
    status: string;
    notes: string;
  };
  measurements?: {
    location: string;
    dimensions: string;
    wireSpacing: string;
    orientation: string;
  }[];
}

export interface AdminDashboardData {
  metrics: {
    totalEnquiries: number;
    siteVisitsScheduled: number;
    pendingQuotations: number;
    confirmedOrders: number;
    activeInstallations: number;
  };
  recentEnquiries: SiteVisitEnquiry[];
}
