import { technicalSpecs, windowInstallationTypes, galleryItems } from "@/data/productData";

/**
 * API Service Layer — Deccan Space Works
 * Connects directly to the Python FastAPI backend.
 */

export function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000";
  }
  // Production default fallback when deployed (e.g. Vercel)
  return "https://deccan-3jik.onrender.com";
}

// Backward-compatible dynamic object that resolves string URL per-access
export const API_BASE_URL = {
  toString: () => getApiBaseUrl(),
  valueOf: () => getApiBaseUrl(),
};

/**
 * Classifies API and network errors into clear, professional, actionable messages.
 */
export function classifyApiError(err, status = null) {
  // 1. HTTP Status classification
  if (status) {
    if (status === 400 || status === 422) {
      return {
        type: "validation",
        status,
        message: err?.message || "Please check the entered information and try again.",
      };
    }
    if (status === 401 || status === 403) {
      return {
        type: "auth",
        status,
        message: "Your session has expired or is unauthorized. Please log in again.",
      };
    }
    if (status === 429) {
      return {
        type: "rate_limit",
        status,
        message: "Too many requests. Please wait a few moments before trying again.",
      };
    }
    if (status >= 500) {
      return {
        type: "server",
        status,
        message: "Server is temporarily experiencing issues. Please contact us directly via phone or WhatsApp.",
      };
    }
  }

  // 2. Client exception / network failure classification
  const msg = err?.message || String(err || "");
  const isTypeError = err?.name === "TypeError" || msg.includes("Failed to fetch") || msg.includes("NetworkError");
  const isTimeout = err?.name === "AbortError" || msg.toLowerCase().includes("timeout");

  if (isTimeout) {
    return {
      type: "timeout",
      status: 408,
      message: "The request timed out. Please check your internet connection or contact us via WhatsApp.",
    };
  }

  if (isTypeError) {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    if (isOffline) {
      return {
        type: "network_offline",
        status: 0,
        message: "No internet connection detected. Please check your network and try again.",
      };
    }
    return {
      type: "network_or_cors",
      status: 0,
      message: "Unable to reach the server (network or security connection error). Please call us directly or chat on WhatsApp.",
    };
  }

  if (msg.includes("not configured") || msg.includes("unavailable")) {
    return {
      type: "configuration",
      status: 0,
      message: "Service configuration is currently unavailable. Please contact us directly via phone or WhatsApp.",
    };
  }

  return {
    type: "unknown",
    status: status || 0,
    message: msg || "An unexpected error occurred. Please contact us via phone or WhatsApp.",
  };
}

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

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

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
    if (err.name === "TypeError" && err.message?.includes("fetch")) {
      throw new Error("Unable to reach the backend server. Please verify the FastAPI service is running and CORS is configured.");
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
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/admin/login`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    if (res.status === 503) {
      throw new Error("Backend service is waking up from standby or temporarily unavailable (HTTP 503). Please wait 30 seconds and try again.");
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      if (res.status === 401) {
        const msg = data.message || (typeof data.detail === "object" ? data.detail?.message : data.detail) || "Invalid email address or password.";
        throw new Error(msg);
      }
      if (res.status >= 500) {
        const msg = data.message || (typeof data.detail === "object" ? data.detail?.message : data.detail) || `Backend internal server error (${res.status}). Please check server logs.`;
        throw new Error(msg);
      }
      const errMsg =
        data.message ||
        (typeof data.detail === "object" ? data.detail?.message : data.detail) ||
        `Login request failed (${res.status}). Please try again.`;
      throw new Error(errMsg);
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
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Service configuration is currently unavailable. Please reach us directly via phone or WhatsApp.");
  }
  try {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const classified = classifyApiError(data, res.status);
      throw new Error(data.message || classified.message);
    }
    return data;
  } catch (err) {
    if (err.name === "TypeError" || err.name === "AbortError") {
      const classified = classifyApiError(err);
      throw new Error(classified.message);
    }
    throw err;
  }
}

export async function getPublicReviews() {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/reviews`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[DSW API] Failed to fetch reviews, using fallback:", err?.message);
      }
    }
  }
  return null;
}

export async function getAdminReviews(status = "All", search = "", page = 1) {
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
  const res = await authFetch(`/api/admin/reviews/${id}/approve`, { method: "PATCH" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to approve review (${res.status})`);
  }
  return res.json();
}

export async function rejectReview(id) {
  const res = await authFetch(`/api/admin/reviews/${id}/reject`, { method: "PATCH" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to reject review (${res.status})`);
  }
  return res.json();
}

export async function deleteReview(id) {
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
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Service configuration is currently unavailable. Please contact us directly via phone or WhatsApp.");
  }
  let body = payload;
  if (!(payload instanceof FormData)) {
    // Automatically convert plain object to FormData for multipart endpoint
    const fd = new FormData();
    Object.entries(payload || {}).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        if (key === "images" && Array.isArray(val)) {
          val.forEach((file) => fd.append("images", file));
        } else {
          fd.append(key, val);
        }
      }
    });
    body = fd;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${baseUrl}/api/site-visits`, {
      method: "POST",
      headers: {},
      body: body,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const classified = classifyApiError(data, res.status);
      throw new Error(data.message || classified.message);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError" || err.name === "TypeError") {
      const classified = classifyApiError(err);
      throw new Error(classified.message);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function createEnquiry(enquiry) {
  // Semantically separate: routes contact enquiry payload to submitContact
  return submitContact(enquiry);
}

export async function getAdminSiteVisits(status = "All", search = "", page = 1) {
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
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Service configuration is currently unavailable. Please contact us directly via phone or WhatsApp.");
  }
  const normalized = {
    name: contactData.name || "",
    phone: contactData.phone || contactData.phoneNumber || "",
    email: contactData.email || "",
    message: contactData.message || contactData.requirementDetails || "General enquiry",
    service: contactData.service || contactData.propertyType || null,
    city: contactData.city || contactData.cityArea || "Hyderabad",
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const classified = classifyApiError(data, res.status);
      throw new Error(data.message || classified.message);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError" || err.name === "TypeError") {
      const classified = classifyApiError(err);
      throw new Error(classified.message);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
export async function getAdminContacts(status = "All", search = "", page = 1) {
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
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/products`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[DSW API] Failed to fetch products, using fallback:", err?.message);
      }
    }
  }
  return null;
}

export async function getAdminProducts() {
  const res = await authFetch("/api/admin/products");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch products (${res.status})`);
  }
  return res.json();
}

export async function createAdminProduct(productData) {
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
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    try {
      const url = category && category !== "All" ? `${baseUrl}/api/gallery?category=${encodeURIComponent(category)}` : `${baseUrl}/api/gallery`;
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
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[DSW API] Failed to fetch gallery, using fallback:", err?.message);
      }
    }
  }
  return galleryItems;
}

export async function getAdminGallery() {
  const res = await authFetch("/api/admin/gallery");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch gallery items (${res.status})`);
  }
  return res.json();
}

export async function createAdminGallery(galleryData) {
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
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/videos`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[DSW API] Failed to fetch videos, using fallback:", err?.message);
      }
    }
  }
  return null;
}

export async function getAdminVideos() {
  const res = await authFetch("/api/admin/videos");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch videos (${res.status})`);
  }
  return res.json();
}

export async function createAdminVideo(videoData) {
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
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/testimonials`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[DSW API] Failed to fetch testimonials, using fallback:", err?.message);
      }
    }
  }
  return null;
}

export async function getAdminTestimonials() {
  const res = await authFetch("/api/admin/testimonials");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch testimonials (${res.status})`);
  }
  return res.json();
}

export async function createAdminTestimonial(data) {
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
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/service-areas`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[DSW API] Failed to fetch service areas, using fallback:", err?.message);
      }
    }
  }
  return null;
}

export async function getAdminServiceAreas() {
  const res = await authFetch("/api/admin/service-areas");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch service areas (${res.status})`);
  }
  return res.json();
}

export async function createAdminServiceArea(data) {
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
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/api/content`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[DSW API] Failed to fetch content, using fallback:", err?.message);
      }
    }
  }
  return null;
}

export async function getAdminContent() {
  const res = await authFetch("/api/admin/content");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch website content (${res.status})`);
  }
  return res.json();
}

export async function updateAdminContent(contentData) {
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
  const res = await authFetch("/api/admin/uploads/media");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch media library (${res.status})`);
  }
  return res.json();
}

export async function deleteAdminMedia(id) {
  const res = await authFetch(`/api/admin/uploads/media/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete media (${res.status})`);
  }
  return res.json();
}

export async function getAdminActivityLogs() {
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
