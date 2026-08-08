import { useEffect, useState } from 'react'
import { clearStoredAuth, getStoredToken } from '../utils/authStorage'

export function useAuthUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()))

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setLoading(false)
      return
    }

    let cancelled = false

    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          clearStoredAuth()
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!cancelled && data) setUser(data)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  function logout() {
    clearStoredAuth()
    setUser(null)
  }

  return { user, logout, loading }
}
