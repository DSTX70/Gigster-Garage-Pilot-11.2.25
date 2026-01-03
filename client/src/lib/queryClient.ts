import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Simple URL resolution - uses relative paths for same-origin requests
const resolveUrl = (path: string): string => {
  if (!path) throw new Error("apiRequest: empty path");
  // If already absolute URL, use as-is
  if (/^https?:\/\//i.test(path)) return path;
  // Otherwise use relative path (Vite serves backend on same port)
  return path;
};

// Custom error class that includes requestId for support correlation
export class ApiError extends Error {
  requestId?: string;
  statusCode: number;

  constructor(message: string, statusCode: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}

// Safe JSON stringify (handles BigInt by stringifying it)
const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v));
  } catch (e: any) {
    throw new Error(`apiRequest: JSON serialization failed: ${e?.message || String(e)}`);
  }
};

// Best-effort: if we see 401/403 anywhere, force re-check of /api/auth/user
function invalidateAuthUserQuery() {
  try {
    const qc = (globalThis as any).__GG_QUERY_CLIENT__;
    if (qc?.invalidateQueries) {
      qc.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  } catch {
    // ignore
  }
}

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiRequest<T = unknown>(
  method: ApiMethod,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const url = resolveUrl(path);
  const hasBody = body !== undefined && method !== "GET";
  const serialized = hasBody ? safeStringify(body) : undefined;

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
    body: serialized,
    ...init,
  });

  // If auth expired, force /api/auth/user to re-check so polling can stop via gating
  if (res.status === 401 || res.status === 403) {
    invalidateAuthUserQuery();
  }

  const contentType = res.headers.get("content-type") || "";
  let parsed: any = null;
  try {
    parsed = contentType.includes("application/json") ? await res.json() : await res.text();
  } catch {
    // Ignore parse error; keep parsed=null so we can surface status text
  }

  if (!res.ok) {
    const serverMsg =
      (parsed && typeof parsed === "object" && (parsed.error?.message || parsed.message)) ||
      (typeof parsed === "string" ? parsed : res.statusText);

    // Extract requestId from response headers for support correlation
    const requestId = res.headers.get("X-Request-Id") || undefined;
    
    throw new ApiError(
      `HTTP ${res.status} ${res.statusText}: ${serverMsg || "Request failed"}`,
      res.status,
      requestId
    );
  }

  return parsed as T;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      invalidateAuthUserQuery();
    }
    const text = (await res.text()) || res.statusText;
    const requestId = res.headers.get("X-Request-Id") || undefined;
    throw new ApiError(`${res.status}: ${text}`, res.status, requestId);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

function isPlainObject(v: any): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Builds a URL from a TanStack queryKey.
 * Fixes "/[object Object]" noise by converting object parts into query params.
 *
 * Examples:
 *  ["/api/timelogs"] -> "/api/timelogs"
 *  ["/api/productivity/stats", {days:7}] -> "/api/productivity/stats?days=7"
 *  ["/api/x", "abc"] -> "/api/x/abc"
 */
function buildUrlFromQueryKey(queryKey: unknown[]): string {
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    throw new Error("QueryFn: invalid queryKey");
  }

  const base = queryKey[0];
  if (typeof base !== "string") {
    throw new Error("QueryFn: queryKey[0] must be a string path");
  }

  let path = base;
  const params = new URLSearchParams();

  for (let i = 1; i < queryKey.length; i++) {
    const part: any = queryKey[i];

    if (part == null) continue;

    if (isPlainObject(part)) {
      for (const [k, v] of Object.entries(part)) {
        if (v == null) continue;
        params.set(k, String(v));
      }
      continue;
    }

    // primitives become path segments
    if (typeof part === "string" || typeof part === "number" || typeof part === "boolean") {
      path += `/${encodeURIComponent(String(part))}`;
      continue;
    }

    // last resort: stringify to query param
    try {
      params.set(`q${i}`, JSON.stringify(part));
    } catch {
      params.set(`q${i}`, String(part));
    }
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildUrlFromQueryKey(queryKey as unknown[]);
    const res = await fetch(resolveUrl(url), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Expose queryClient for best-effort auth invalidation without circular TS ordering issues
(globalThis as any).__GG_QUERY_CLIENT__ = queryClient;
