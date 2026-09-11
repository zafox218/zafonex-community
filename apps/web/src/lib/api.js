const BASE = import.meta.env.VITE_API_URL || '/api/v1';

let accessToken = null;
let refreshToken = localStorage.getItem('zx_refresh');
let refreshing = null;

export const setTokens = (access, refresh) => {
  accessToken = access;
  if (refresh) {
    refreshToken = refresh;
    localStorage.setItem('zx_refresh', refresh);
  }
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('zx_refresh');
};

export const hasSession = () => Boolean(refreshToken);

async function raw(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const error = new Error(data?.error?.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.details = data?.error?.details;
    throw error;
  }
  return data;
}

/// Single-flight refresh: parallel 401s wait on one rotation, not five.
async function rotate() {
  if (!refreshToken) throw new Error('No session');
  refreshing ??= raw('/auth/refresh', { method: 'POST', body: { refreshToken } })
    .then((data) => { setTokens(data.accessToken, data.refreshToken); return data; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function api(path, options = {}) {
  try {
    return await raw(path, options);
  } catch (err) {
    if (err.status !== 401 || !refreshToken || options._retried) throw err;
    await rotate();
    return raw(path, { ...options, _retried: true });
  }
}

export const get   = (p) => api(p);
export const post  = (p, body) => api(p, { method: 'POST', body });
export const patch = (p, body) => api(p, { method: 'PATCH', body });
export const del   = (p) => api(p, { method: 'DELETE' });
