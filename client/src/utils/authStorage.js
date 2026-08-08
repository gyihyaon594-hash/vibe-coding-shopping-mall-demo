export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export function clearStoredAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
}
