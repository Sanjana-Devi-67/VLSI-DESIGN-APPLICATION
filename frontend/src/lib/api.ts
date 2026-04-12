const API_BASE = "http://127.0.0.1:8001";

/**
 * Get auth headers from localStorage
 */
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Authenticated fetch wrapper for the QANTYX backend
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  return res;
}

/**
 * Upload a CSV file to the semiconductor service
 */
export const uploadCSV = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8002/upload_predict", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    return await res.json();
  } catch (error) {
    console.error("Upload error:", error);
  }
};

/**
 * Logout — clear stored auth data
 */
export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

/**
 * Get stored user data
 */
export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  if (user) {
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("token");
}