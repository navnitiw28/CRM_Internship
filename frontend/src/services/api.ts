const getApiBase = () => {
  const configured = (import.meta as any).env?.VITE_API_URL;
  if (configured) return configured;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return window.location.origin;
    }
  }
  return "http://localhost:5000";
};

export const API_URL = getApiBase();

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown>;
  token?: string | null;
}

export async function apiRequest(path: string, options: ApiOptions = {}) {
  const headers: HeadersInit = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const body = options.body;
  const isFormData = body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || "Server error");
  }

  return data;
}
