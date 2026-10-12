import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/store/authStore";

// NEXT_PUBLIC_API_URL should point at the NestJS API's global prefix,
// e.g. https://api.gravitest.ng/api/v1 (prod) or http://localhost:5000/api/v1 (dev)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    if (error.response?.status !== 401 || original?._retried || !original) {
      return Promise.reject(error);
    }

    original._retried = true;

    // Coalesce concurrent 401s into a single refresh call.
    refreshInFlight ??= refreshAccessToken();
    const newToken = await refreshInFlight;
    refreshInFlight = null;

    if (!newToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken ?? refreshToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

export interface ApiErrorShape {
  message: string | string[];
  statusCode: number;
  error?: string;
}

/**
 * Error for calls made with `fetch` (not axios), e.g. streaming endpoints.
 * Carries the HTTP status and the parsed JSON body so the server's message and
 * structured fields (like `code: "UPGRADE_REQUIRED"`) are not lost — a bare
 * `new Error("failed (403)")` ends up as "Something went wrong" for the user.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Builds an HttpError from a non-OK fetch Response, using the NestJS error
 * body's `message` when there is one.
 */
export async function httpErrorFromResponse(res: Response, fallback: string): Promise<HttpError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  const m = (body as ApiErrorShape | undefined)?.message;
  const message = Array.isArray(m) ? m.join(", ") : typeof m === "string" && m ? m : fallback;
  return new HttpError(message, res.status, body);
}

/** Normalizes a NestJS error response (or network error) into one readable string. */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof HttpError) return err.message;
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorShape | undefined;
    if (data?.message) return Array.isArray(data.message) ? data.message.join(", ") : data.message;
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}
