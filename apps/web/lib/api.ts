import { getToken } from "@/lib/auth";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_URL = configuredApiUrl && configuredApiUrl.length > 0 ? configuredApiUrl : "/api";
const FALLBACK_API_URL = "/api";

async function parseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload.detail === "string") {
      return payload.detail;
    }
    if (payload && Array.isArray(payload.detail)) {
      return payload.detail.map((item: { msg?: string }) => item?.msg).filter(Boolean).join(", ");
    }
  }

  const text = await response.text();
  return text || `Request failed with status ${response.status}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const hasBody = typeof options.body !== "undefined";
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  async function call(baseUrl: string): Promise<Response> {
    return fetch(`${baseUrl}${normalizedPath}`, {
      ...options,
      headers,
    });
  }

  let response: Response;
  try {
    response = await call(API_URL);
  } catch (error) {
    if (API_URL !== FALLBACK_API_URL) {
      response = await call(FALLBACK_API_URL);
    } else {
      throw error;
    }
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<T>;
}
