const ACCESS_TOKEN_STORAGE_KEY = 'inventory-access-token'

let accessToken = typeof window === 'undefined' ? null : window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
let sessionClearedHandler: (() => void) | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token

  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}

export function clearAccessToken() {
  setAccessToken(null)
}

export function registerSessionClearedHandler(handler: () => void) {
  sessionClearedHandler = handler
}

export function clearSessionState() {
  clearAccessToken()
  sessionClearedHandler?.()
}
