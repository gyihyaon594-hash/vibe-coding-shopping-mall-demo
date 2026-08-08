import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NAV_LINKS } from '../../data/academyData'
import { useAuthUser } from '../../hooks/useAuthUser'
import { getStoredToken } from '../../utils/authStorage'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthUser()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    if (!user) {
      setCartCount(0)
      return
    }

    let cancelled = false
    const token = getStoredToken()

    fetch('/api/carts', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (!cancelled && data) {
          setCartCount(data.totalQuantity || 0)
        }
      })
      .catch(() => {
        if (!cancelled) setCartCount(0)
      })

    function handleCartUpdated(e) {
      if (typeof e.detail?.totalQuantity === 'number') {
        setCartCount(e.detail.totalQuantity)
      }
    }

    window.addEventListener('cart:updated', handleCartUpdated)
    return () => {
      cancelled = true
      window.removeEventListener('cart:updated', handleCartUpdated)
    }
  }, [user])

  function handleLogout() {
    setMenuOpen(false)
    setCartCount(0)
    window.dispatchEvent(
      new CustomEvent('cart:updated', { detail: { totalQuantity: 0 } })
    )
    logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      <div className="notice-bar">
        NOTICE 2026 상반기 연구자 과정 오픈 · 사전등록 시 전 과정 30% 할인
      </div>

      <header className="academy-header">
        <div className="academy-header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 3c-5 3-9 7.5-9 13a9 9 0 0 0 18 0c0-5.5-4-10-9-13z"
                  fill="#1d4ed8"
                />
                <path
                  d="M12.5 17.5c1.2 1 2.2 1.5 3.5 1.5s2.3-.5 3.5-1.5"
                  stroke="#fff"
                  strokeWidth="1.6"
                />
              </svg>
            </span>
            <span className="brand-text">
              KHU_DEMENTIA
              <small>ACADEMY</small>
            </span>
          </Link>

          <nav className="main-nav" aria-label="주요 메뉴">
            {NAV_LINKS.map((link) => (
              <button type="button" key={link}>
                {link}
              </button>
            ))}
          </nav>

          <div className="header-right">
            <form className="search-box" onSubmit={(e) => e.preventDefault()}>
              <input
                type="search"
                placeholder="강의 · 연구진 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="강의 검색"
              />
              <button type="submit" aria-label="검색">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            </form>

            {user?.user_type === 'admin' && (
              <Link to="/admin" className="admin-button">
                어드민
              </Link>
            )}

            {user ? (
              <div className="user-menu" ref={menuRef}>
                <button
                  type="button"
                  className="user-greeting-button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  {user.name}님 환영합니다
                  <span className="user-greeting-caret" aria-hidden="true">
                    {menuOpen ? '▴' : '▾'}
                  </span>
                </button>
                {menuOpen && (
                  <div className="user-dropdown" role="menu">
                    <button
                      type="button"
                      className="logout-button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        // 관리자는 주문 관리, 일반 사용자는 내 주문 내역으로
                        navigate(user.user_type === 'admin' ? '/admin/orders' : '/orders')
                      }}
                    >
                      {user.user_type === 'admin' ? '주문 관리' : '내 주문 내역'}
                    </button>
                    <button
                      type="button"
                      className="logout-button"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="header-link signup">
                  로그인
                </Link>
              </div>
            )}

            <Link
              to={user ? '/cart' : '/login'}
              className="cart-link"
              aria-label={`장바구니${cartCount > 0 ? `, ${cartCount}개` : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8V7a3 3 0 0 1 6 0v1" />
              </svg>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
