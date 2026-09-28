// All HTTP calls go through this file.
// The access token lives only in this variable (memory) - not in localStorage -
// so XSS can't read it from storage. The refresh token is an httpOnly cookie
// that the browser sends automatically; JS never sees it.
let accessToken = null;
export const setAccessToken = (t) => { accessToken = t; };

// In development this stays same-origin (/api) and Vite proxies to localhost:5000.
// In production set VITE_API_URL to the deployed Express/Vercel backend URL.
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Error object carrying HTTP status + a {field: message} map from the API's 400 responses
export class ApiError extends Error {
  constructor(status, data) {
    super(data?.message || 'Something went wrong');
    this.status = status;
    this.fields = Object.fromEntries((data?.errors || []).map((e) => [e.field, e.message]));
  }
}

async function send(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers,
    credentials: 'include', // send/receive the refresh cookie
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

// Ask the server for a new access token using the refresh cookie.
// Shared promise so parallel 401s trigger only ONE refresh (tokens rotate, a 2nd call would look like reuse).
let refreshing = null;
export function refreshAccessToken() {
  refreshing ??= send('/auth/refresh-token', { method: 'POST', auth: false })
    .then(({ res, data }) => {
      if (!res.ok) { setAccessToken(null); throw new ApiError(res.status, data); }
      setAccessToken(data.accessToken);
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

// Main helper: on a 401 from a protected call, refresh once and retry the original request.
export async function api(path, opts = {}) {
  let { res, data } = await send(path, opts);
  if (res.status === 401 && opts.auth !== false) {
    try {
      await refreshAccessToken();
      ({ res, data } = await send(path, opts));
    } catch { /* refresh failed => fall through with original 401 */ }
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
