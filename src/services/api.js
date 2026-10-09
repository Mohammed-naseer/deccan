import { technicalSpecs, windowInstallationTypes, galleryItems } from "@/data/productData";

/**
 * API Service Layer — Deccan Space Works
 * Connects directly to the Python FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:8000" : "");

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

// Helper to make authenticated admin requests with timeout protection
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

  // 15-second bounded network timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    
    if (res.status === 401) {
      removeAdminSession();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    return res;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out after 15 seconds. Please check your backend connection.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// ADMIN AUTHENTICATION
// ---------------------------------------------------------------------------

export async function adminLogin(email, password) {
  const url = `${API_BASE_URL}/api/admin/login`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Invalid credentials.");
    }
    if (!data.data?.token) {
      throw new Error("Authentication response did not contain a valid session token.");
    }
    setAdminToken(data.data.token);
    setAdminUser(data.data.admin);
    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message?.includes("fetch")) {
      throw new Error("Unable to connect to the backend server. Please verify the FastAPI service is running.");
    }
    throw err;
  }
}

export async function getAdminProfile() {
  const res = await authFetch("/api/admin/me");
  if (!res.ok) {
    throw new Error("Failed to verify session.");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// ADMIN DASHBOARD
// ---------------------------------------------------------------------------

export async function getAdminDashboard() {
  if (!API_BASE_URL) {
    throw new Error("Backend service URL is not configured.");
  }
  const res = await authFetch("/api/admin/dashboard");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Dashboard metrics unavailable (${res.status}).`);
  }
  const json = await res.json();
  return json.data;
}

// ---------------------------------------------------------------------------
// REVIEWS MANAGEMENT (Public + Admin)
// ---------------------------------------------------------------------------

export async function submitReview(reviewData) {
  if (!API_BASE_URL) {
    throw new Error("Backend service is currently not configured. Please reach us directly via phone or WhatsApp.");
  }
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

export async function getPublicReviews() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminReviews(status = "All", search = "", page = 1) {
  if (!API_BASE_URL) {
    throw new Error("Backend service URL is not configured.");
  }
  const query = new URLSearchParams({ page, limit: 20 });
  if (status && status !== "All") query.append("status", status);
  if (search) query.append("search", search);
  const res = await authFetch(`/api/admin/reviews?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch reviews (${res.status})`);
  }
  return res.json();
}

export async function approveReview(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/reviews/${id}/approve`, { method: "PATCH" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to approve review (${res.status})`);
  }
  return res.json();
}

export async function rejectReview(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/reviews/${id}/reject`, { method: "PATCH" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to reject review (${res.status})`);
  }
  return res.json();
}

export async function deleteReview(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete review (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// FREE SITE VISITS (Public + Admin)
// ---------------------------------------------------------------------------

export async function submitSiteVisit(payload) {
  if (!API_BASE_URL) {
    throw new Error("Backend service is currently not configured. Please contact us directly via phone or WhatsApp.");
  }
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

export async function createEnquiry(enquiry) {
  return submitSiteVisit(enquiry);
}

export async function getAdminSiteVisits(status = "All", search = "", page = 1) {
  if (!API_BASE_URL) {
    throw new Error("Backend service URL is not configured.");
  }
  const query = new URLSearchParams({ page, limit: 20 });
  if (status && status !== "All") query.append("status", status);
  if (search) query.append("search", search);
  const res = await authFetch(`/api/admin/site-visits?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch site visits (${res.status})`);
  }
  return res.json();
}

export async function updateSiteVisitStatus(id, statusOrPayload, adminNotes = null) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const payload = typeof statusOrPayload === "object" && statusOrPayload !== null
    ? statusOrPayload
    : { status: statusOrPayload, adminNotes };
  const res = await authFetch(`/api/admin/site-visits/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update site visit (${res.status})`);
  }
  return res.json();
}

export async function deleteSiteVisit(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/site-visits/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete site visit (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// CONTACT ENQUIRIES (Public + Admin)
// ---------------------------------------------------------------------------

export async function submitContact(contactData) {
  if (!API_BASE_URL) {
    throw new Error("Backend service is currently not configured. Please contact us directly via phone or WhatsApp.");
  }
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

export async function getAdminContacts(status = "All", search = "", page = 1) {
  if (!API_BASE_URL) {
    throw new Error("Backend service URL is not configured.");
  }
  const query = new URLSearchParams({ page, limit: 20 });
  if (status && status !== "All") query.append("status", status);
  if (search) query.append("search", search);
  const res = await authFetch(`/api/admin/contacts?${query.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch contacts (${res.status})`);
  }
  return res.json();
}

export async function updateContactStatus(id, statusOrPayload, adminNotes = null) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const payload = typeof statusOrPayload === "object" && statusOrPayload !== null
    ? statusOrPayload
    : { status: statusOrPayload, adminNotes };
  const res = await authFetch(`/api/admin/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update contact (${res.status})`);
  }
  return res.json();
}

export async function convertContactToSiteVisit(contactId, payload = {}) {
  if (!API_BASE_URL) {
    throw new Error("Backend service URL is not configured.");
  }
  const res = await authFetch(`/api/admin/contacts/${contactId}/convert-to-site-visit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to convert contact to site visit (${res.status})`);
  }
  return res.json();
}

export async function deleteContact(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete contact (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// PRODUCTS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicProducts() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminProducts() {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/products");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch products (${res.status})`);
  }
  return res.json();
}

export async function createAdminProduct(productData) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create product (${res.status})`);
  }
  return res.json();
}

export async function updateAdminProduct(id, productData) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update product (${res.status})`);
  }
  return res.json();
}

export async function deleteAdminProduct(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/products/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete product (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// GALLERY (Public + Admin)
// ---------------------------------------------------------------------------

export async function getGallery(category = "All") {
  if (API_BASE_URL) {
    try {
      const url = category && category !== "All" ? `${API_BASE_URL}/api/gallery?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/api/gallery`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          return json.data.map((item, idx) => ({
            id: item._id || item.id || `gal-${idx}`,
            image: item.imageUrl || item.image || "/images/hero_balcony.jpg",
            title: item.title || "Invisible Grill Installation",
            caption: item.description || item.caption || "",
            category: item.category || "Balconies",
            displayOrder: item.displayOrder || idx + 1,
            status: item.status || "active",
          }));
        }
      }
    } catch {}
  }
  return galleryItems;
}

export async function getAdminGallery() {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/gallery");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch gallery items (${res.status})`);
  }
  return res.json();
}

export async function createAdminGallery(galleryData) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/gallery", {
    method: "POST",
    body: JSON.stringify(galleryData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create gallery item (${res.status})`);
  }
  return res.json();
}

export async function updateAdminGallery(id, galleryData) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/gallery/${id}`, {
    method: "PATCH",
    body: JSON.stringify(galleryData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update gallery item (${res.status})`);
  }
  return res.json();
}

export async function deleteAdminGallery(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete gallery item (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// VIDEOS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicVideos() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/videos`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminVideos() {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/videos");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch videos (${res.status})`);
  }
  return res.json();
}

export async function createAdminVideo(videoData) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/videos", {
    method: "POST",
    body: JSON.stringify(videoData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create video (${res.status})`);
  }
  return res.json();
}

export async function updateAdminVideo(id, videoData) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/videos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(videoData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update video (${res.status})`);
  }
  return res.json();
}

export async function deleteAdminVideo(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/videos/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete video (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// TESTIMONIALS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicTestimonials() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/testimonials`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminTestimonials() {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/testimonials");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch testimonials (${res.status})`);
  }
  return res.json();
}

export async function createAdminTestimonial(data) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/testimonials", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create testimonial (${res.status})`);
  }
  return res.json();
}

export async function updateAdminTestimonial(id, data) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/testimonials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update testimonial (${res.status})`);
  }
  return res.json();
}

export async function deleteAdminTestimonial(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete testimonial (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// SERVICE AREAS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicServiceAreas() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/service-areas`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminServiceAreas() {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/service-areas");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch service areas (${res.status})`);
  }
  return res.json();
}

export async function createAdminServiceArea(data) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/service-areas", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create service area (${res.status})`);
  }
  return res.json();
}

export async function updateAdminServiceArea(id, data) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/service-areas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update service area (${res.status})`);
  }
  return res.json();
}

export async function deleteAdminServiceArea(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/service-areas/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete service area (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// WEBSITE CONTENT & STATS (Public + Admin)
// ---------------------------------------------------------------------------

export async function getPublicContent() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/content`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
  }
  return null;
}

export async function getAdminContent() {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/content");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch website content (${res.status})`);
  }
  return res.json();
}

export async function updateAdminContent(contentData) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/content", {
    method: "PATCH",
    body: JSON.stringify(contentData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update website content (${res.status})`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// MEDIA UPLOAD & LIBRARY
// ---------------------------------------------------------------------------

export async function uploadImageMedia(file) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const formData = new FormData();
  formData.append("file", file);
  const res = await authFetch("/api/admin/uploads/image", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to upload image (${res.status})`);
  }
  return res.json();
}

export async function uploadVideoMedia(file) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const formData = new FormData();
  formData.append("file", file);
  const res = await authFetch("/api/admin/uploads/video", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to upload video (${res.status})`);
  }
  return res.json();
}

export async function getAdminMediaLibrary() {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/uploads/media");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch media library (${res.status})`);
  }
  return res.json();
}

export async function deleteAdminMedia(id) {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch(`/api/admin/uploads/media/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete media (${res.status})`);
  }
  return res.json();
}

export async function getAdminActivityLogs() {
  if (!API_BASE_URL) throw new Error("Backend service URL is not configured.");
  const res = await authFetch("/api/admin/dashboard/activity");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch activity logs (${res.status})`);
  }
  return res.json();
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
