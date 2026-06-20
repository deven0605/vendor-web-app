const TOKEN_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!refreshToken) return false

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false

    const json = await res.json()
    localStorage.setItem(TOKEN_KEY, json.data.accessToken)
    localStorage.setItem(REFRESH_KEY, json.data.refreshToken)
    return true
  } catch {
    return false
  }
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  window.location.href = '/login'
}

// Drop-in replacement for fetch that adds the Bearer token and retries once on 401.
export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY)

  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(input, { ...init, headers })

  if (res.status !== 401) return res

  // Token expired — try to refresh once
  const refreshed = await tryRefresh()
  if (!refreshed) {
    clearSession()
    return res
  }

  const newToken = localStorage.getItem(TOKEN_KEY)
  const retryHeaders = new Headers(init.headers)
  if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`)

  return fetch(input, { ...init, headers: retryHeaders })
}

export async function logoutApi(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (refreshToken) {
    try {
      await authFetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      // best-effort — clear session regardless
    }
  }
  clearSession()
}
