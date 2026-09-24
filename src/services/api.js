import { technicalSpecs, windowInstallationTypes, galleryItems } from "@/data/productData";
import { mockCustomerData, mockAdminData } from "@/data/mockPortalData";

/**
 * API Service Layer — Deccan Space Works
 * Connects seamlessly to the Python FastAPI production backend when NEXT_PUBLIC_API_BASE_URL is set,
 * or gracefully falls back to local data/simulation in development.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Token Management for Admin Portal
export function getAdminToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("dsw_admin_token") || "";
  }
  return "";
}

export function setAdminToken(token) {
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("dsw_admin_token", token);
    else localStorage.removeItem("dsw_admin_token");
  }
}

export function getAdminUser() {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem("dsw_admin_user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function setAdminUser(user) {
  if (typeof window !== "undefined") {
    if (user) localStorage.setItem("dsw_admin_user", JSON.stringify(user));
    else localStorage.removeItem("dsw_admin_user");
  }
}

export function removeAdminSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("dsw_admin_token");
    localStorage.removeItem("dsw_admin_user");
  }
}

// Helper to make authenticated admin requests
async function authFetch(path, options = {}) {
  const token = getAdminToken();
  const headers = {
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    removeAdminSession();
    if (typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
      window.location.href = "/admin/login";
    }
  }
  return res;
}

// ---------------------------------------------------------------------------
// ADMIN AUTHENTICATION
// ---------------------------------------------------------------------------

export async function adminLogin(email, password) {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Invalid credentials.");
    }
    setAdminToken(data.data.token);
    setAdminUser(data.data.admin);
    return data;
  }

  // Development mock fallback if no backend is running
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (email && password.length >= 6) {
    const mockToken = "mock_jwt_token_for_dev_preview";
    const mockUser = { name: "Deccan Administrator", email, role: "superadmin" };
    setAdminToken(mockToken);
    setAdminUser(mockUser);
    return { success: true, message: "Login successful (dev mode)", data: { token: mockToken, admin: mockUser } };
  }
  throw new Error("Invalid email or password.");
}

export async function getAdminProfile() {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/me");
    if (!res.ok) throw new Error("Failed to verify session.");
    return res.json();
  }
  return { success: true, data: getAdminUser() };
}

// ---------------------------------------------------------------------------
// ADMIN DASHBOARD
// ---------------------------------------------------------------------------

export async function getAdminDashboard() {
  if (API_BASE_URL) {
    try {
      const res = await authFetch("/api/admin/dashboard");
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.warn("Backend dashboard fetch failed, falling back to mock portal data:", err);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockAdminData;
}

// ---------------------------------------------------------------------------
// REVIEWS MANAGEMENT (Public + Admin)
// ---------------------------------------------------------------------------

export async function submitReview(reviewData) {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error: ${res.status}`);
    }
    return res.json();
  }
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    success: true,
    message: "Thank you for your review. Your review has been submitted successfully and is pending approval.",
  };
}

export async function getPublicReviews() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminReviews(status = "All", search = "", page = 1) {
  if (API_BASE_URL) {
    const query = new URLSearchParams({ page, limit: 20 });
    if (status && status !== "All") query.append("status", status);
    if (search) query.append("search", search);
    const res = await authFetch(`/api/admin/reviews?${query.toString()}`);
    if (res.ok) return res.json();
  }
  return {
    success: true,
    data: {
      items: [
        { _id: "rev1", name: "Ramesh Chandra", city: "Gachibowli", rating: 5, review: "Excellent service from start to finish.", status: "approved", createdAt: new Date().toISOString() },
        { _id: "rev2", name: "Priya Sharma", city: "Jubilee Hills", rating: 5, review: "Installed SS 316 marine grade grills. Wire tension is rock solid.", status: "approved", createdAt: new Date().toISOString() },
        { _id: "rev3", name: "Vikram Nair", city: "Kondapur", rating: 5, review: "No hidden charges, clean installation.", status: "pending", createdAt: new Date().toISOString() },
      ],
      total: 3,
      page: 1,
      totalPages: 1
    }
  };
}

export async function approveReview(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/reviews/${id}/approve`, { method: "PATCH" });
    return res.json();
  }
  return { success: true, message: "Review approved" };
}

export async function rejectReview(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/reviews/${id}/reject`, { method: "PATCH" });
    return res.json();
  }
  return { success: true, message: "Review rejected" };
}

export async function deleteReview(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    return res.json();
  }
  return { success: true, message: "Review deleted" };
}

// ---------------------------------------------------------------------------
// FREE SITE VISITS (Public + Admin)
// ---------------------------------------------------------------------------

export async function submitSiteVisit(payload) {
  if (API_BASE_URL) {
    const isFormData = payload instanceof FormData;
    const res = await fetch(`${API_BASE_URL}/api/site-visits`, {
      method: "POST",
      headers: isFormData ? {} : { "Content-Type": "application/json" },
      body: isFormData ? payload : JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error: ${res.status}`);
    }
    return res.json();
  }

  await new Promise((resolve) => setTimeout(resolve, 900));
  return {
    success: true,
    id: `DSW-HYD-${Math.floor(1000 + Math.random() * 9000)}`,
    message: "Thank you! Your site visit request has been received. Our team will contact you promptly.",
  };
}

export async function createEnquiry(enquiry) {
  return submitSiteVisit(enquiry);
}

export async function getAdminSiteVisits(status = "All", search = "", page = 1) {
  if (API_BASE_URL) {
    const query = new URLSearchParams({ page, limit: 20 });
    if (status && status !== "All") query.append("status", status);
    if (search) query.append("search", search);
    const res = await authFetch(`/api/admin/site-visits?${query.toString()}`);
    if (res.ok) return res.json();
  }
  return {
    success: true,
    data: {
      items: [
        { _id: "sv1", name: "Anand Verma", phoneNumber: "9876543210", cityArea: "Gachibowli", propertyType: "Apartment", windowType: "Balcony", status: "new", preferredTime: "Morning", createdAt: new Date().toISOString(), imageUrls: [] },
        { _id: "sv2", name: "Sunita Reddy", phoneNumber: "9123456789", cityArea: "Jubilee Hills", propertyType: "Villa", windowType: "Fixed Window", status: "scheduled", preferredTime: "Afternoon", createdAt: new Date().toISOString(), imageUrls: [] }
      ],
      total: 2,
      page: 1,
      totalPages: 1
    }
  };
}

export async function updateSiteVisitStatus(id, status, adminNotes = null) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/site-visits/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes }),
    });
    return res.json();
  }
  return { success: true, message: `Status updated to ${status}` };
}

export async function deleteSiteVisit(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/site-visits/${id}`, { method: "DELETE" });
    return res.json();
  }
  return { success: true, message: "Site visit deleted" };
}

// ---------------------------------------------------------------------------
// CONTACT ENQUIRIES (Public + Admin)
// ---------------------------------------------------------------------------

export async function submitContact(contactData) {
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error: ${res.status}`);
    }
    return res.json();
  }

  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    success: true,
    message: "Your message has been received. We'll get back to you within 24 hours.",
  };
}

export async function getAdminContacts(status = "All", search = "", page = 1) {
  if (API_BASE_URL) {
    const query = new URLSearchParams({ page, limit: 20 });
    if (status && status !== "All") query.append("status", status);
    if (search) query.append("search", search);
    const res = await authFetch(`/api/admin/contacts?${query.toString()}`);
    if (res.ok) return res.json();
  }
  return {
    success: true,
    data: {
      items: [
        { _id: "c1", name: "Kiran Rao", phone: "9876543210", email: "kiran@example.com", service: "Invisible Grills — Balcony", city: "Kondapur", message: "Need quote for 2 balconies.", status: "new", createdAt: new Date().toISOString() }
      ],
      total: 1,
      page: 1,
      totalPages: 1
    }
  };
}

export async function updateContactStatus(id, status, adminNotes = null) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes }),
    });
    return res.json();
  }
  return { success: true, message: `Status updated to ${status}` };
}

export async function deleteContact(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    return res.json();
  }
  return { success: true, message: "Contact enquiry deleted" };
}

// ---------------------------------------------------------------------------
// PRODUCTS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicProducts() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminProducts() {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/products");
    if (res.ok) return res.json();
  }
  return { success: true, data: [] };
}

export async function createAdminProduct(productData) {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
    return res.json();
  }
  return { success: true, data: productData };
}

export async function updateAdminProduct(id, productData) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(productData),
    });
    return res.json();
  }
  return { success: true, message: "Product updated" };
}

export async function deleteAdminProduct(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/products/${id}`, { method: "DELETE" });
    return res.json();
  }
  return { success: true, message: "Product deleted" };
}

// ---------------------------------------------------------------------------
// GALLERY (Public + Admin)
// ---------------------------------------------------------------------------

export async function getGallery(category = "All") {
  if (API_BASE_URL) {
    try {
      const url = category && category !== "All" ? `${API_BASE_URL}/api/gallery?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/api/gallery`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return galleryItems;
}

export async function getAdminGallery() {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/gallery");
    if (res.ok) return res.json();
  }
  return { success: true, data: galleryItems };
}

export async function createAdminGallery(galleryData) {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/gallery", {
      method: "POST",
      body: JSON.stringify(galleryData),
    });
    return res.json();
  }
  return { success: true, data: galleryData };
}

export async function updateAdminGallery(id, galleryData) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/gallery/${id}`, {
      method: "PATCH",
      body: JSON.stringify(galleryData),
    });
    return res.json();
  }
  return { success: true, message: "Gallery image updated" };
}

export async function deleteAdminGallery(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    return res.json();
  }
  return { success: true, message: "Gallery photo deleted" };
}

// ---------------------------------------------------------------------------
// VIDEOS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicVideos() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/videos`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminVideos() {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/videos");
    if (res.ok) return res.json();
  }
  return { success: true, data: [] };
}

export async function createAdminVideo(videoData) {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/videos", {
      method: "POST",
      body: JSON.stringify(videoData),
    });
    return res.json();
  }
  return { success: true, data: videoData };
}

export async function updateAdminVideo(id, videoData) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/videos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(videoData),
    });
    return res.json();
  }
  return { success: true, message: "Video updated" };
}

export async function deleteAdminVideo(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    return res.json();
  }
  return { success: true, message: "Video deleted" };
}

// ---------------------------------------------------------------------------
// TESTIMONIALS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicTestimonials() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/testimonials`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminTestimonials() {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/testimonials");
    if (res.ok) return res.json();
  }
  return { success: true, data: [] };
}

export async function createAdminTestimonial(data) {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/testimonials", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.json();
  }
  return { success: true, data };
}

export async function updateAdminTestimonial(id, data) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.json();
  }
  return { success: true, message: "Testimonial updated" };
}

export async function deleteAdminTestimonial(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    return res.json();
  }
  return { success: true, message: "Testimonial deleted" };
}

// ---------------------------------------------------------------------------
// SERVICE AREAS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicServiceAreas() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/service-areas`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminServiceAreas() {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/service-areas");
    if (res.ok) return res.json();
  }
  return { success: true, data: [] };
}

export async function createAdminServiceArea(data) {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/service-areas", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.json();
  }
  return { success: true, data };
}

export async function updateAdminServiceArea(id, data) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/service-areas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.json();
  }
  return { success: true, message: "Area updated" };
}

export async function deleteAdminServiceArea(id) {
  if (API_BASE_URL) {
    const res = await authFetch(`/api/admin/service-areas/${id}`, { method: "DELETE" });
    return res.json();
  }
  return { success: true, message: "Area deleted" };
}

// ---------------------------------------------------------------------------
// WEBSITE CONTENT & STATS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicContent() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/content`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminContent() {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/content");
    if (res.ok) return res.json();
  }
  return { success: true, data: {} };
}

export async function updateAdminContent(contentData) {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/content", {
      method: "PATCH",
      body: JSON.stringify(contentData),
    });
    return res.json();
  }
  return { success: true, message: "Content updated" };
}

// ---------------------------------------------------------------------------
// MEDIA UPLOAD & LIBRARY
// ---------------------------------------------------------------------------

export async function uploadImageMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/uploads/image", {
      method: "POST",
      body: formData,
    });
    return res.json();
  }
  return { success: true, data: { secure_url: URL.createObjectURL(file), public_id: "local_preview" } };
}

export async function uploadVideoMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/uploads/video", {
      method: "POST",
      body: formData,
    });
    return res.json();
  }
  return { success: true, data: { secure_url: URL.createObjectURL(file), public_id: "local_video_preview" } };
}

export async function getAdminMediaLibrary() {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/uploads/media");
    if (res.ok) return res.json();
  }
  return { success: true, data: [] };
}

export async function getAdminActivityLogs() {
  if (API_BASE_URL) {
    const res = await authFetch("/api/admin/dashboard/activity");
    if (res.ok) return res.json();
  }
  return { success: true, data: [] };
}

// ---------------------------------------------------------------------------
// EXISTING PUBLIC SPECIFICATIONS & LEGACY HELPERS (PRESERVED)
// ---------------------------------------------------------------------------

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

export async function getCustomerEnquiry(id) {
  if (API_BASE_URL && id) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer/${id}`);
      return res.json();
    } catch {}
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCustomerData;
}

export async function getCustomerQuotation(id) {
  const data = await getCustomerEnquiry(id);
  return data.quotation;
}

export async function getCustomerStatus(id) {
  const data = await getCustomerEnquiry(id);
  return {
    currentStep: data.currentStep,
    totalSteps: data.totalSteps,
    steps: data.steps,
  };
}
