import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/academy/Navbar'
import AcademyFooter from '../components/academy/AcademyFooter'
import { useAuthUser } from '../hooks/useAuthUser'
import { getStoredToken } from '../utils/authStorage'
import { formatPrice } from '../data/academyData'
import './CartPage.css'
import './MainPage.css'

function notifyCartUpdated(totalQuantity) {
  window.dispatchEvent(
    new CustomEvent('cart:updated', { detail: { totalQuantity } })
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthUser()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  async function loadCart() {
    setLoading(true)
    setError('')
    try {
      const token = getStoredToken()
      const res = await fetch('/api/carts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '장바구니를 불러오지 못했습니다.')
        setCart(null)
        return
      }
      setCart(data)
      notifyCartUpdated(data.totalQuantity || 0)
    } catch {
      setError('서버에 연결할 수 없습니다.')
      setCart(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    loadCart()
  }, [user])

  async function updateQuantity(productId, quantity) {
    setUpdatingId(productId)
    setError('')
    try {
      const token = getStoredToken()
      const res = await fetch(`/api/carts/items/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '수량 변경에 실패했습니다.')
        return
      }
      setCart(data)
      notifyCartUpdated(data.totalQuantity || 0)
    } catch {
      setError('서버에 연결할 수 없습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function removeItem(productId) {
    setUpdatingId(productId)
    setError('')
    try {
      const token = getStoredToken()
      const res = await fetch(`/api/carts/items/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '삭제에 실패했습니다.')
        return
      }
      setCart(data)
      notifyCartUpdated(data.totalQuantity || 0)
    } catch {
      setError('서버에 연결할 수 없습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (authLoading) {
    return (
      <div className="cart-page">
        <Navbar />
        <p className="cart-status">불러오는 중...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  const items = cart?.items || []

  return (
    <div className="cart-page">
      <Navbar />

      <main className="cart-main">
        <div className="cart-header">
          <h1>장바구니</h1>
          <p>
            {cart?.totalQuantity || 0}개 상품 · 합계{' '}
            {formatPrice(cart?.totalPrice || 0)}
          </p>
        </div>

        {error && <p className="cart-error">{error}</p>}

        {loading ? (
          <p className="cart-status">장바구니를 불러오는 중...</p>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <p>장바구니가 비어 있습니다.</p>
            <Link to="/#courses" className="cart-continue">
              강의 둘러보기
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <ul className="cart-list">
              {items.map((item) => {
                const product = item.product
                const productId = product?._id || item.product
                const disabled = updatingId === productId

                return (
                  <li key={productId} className="cart-item">
                    <Link to={`/products/${productId}`} className="cart-thumb">
                      {product?.image ? (
                        <img src={product.image} alt={product.name || '상품'} />
                      ) : (
                        <span className="cart-thumb-fallback" />
                      )}
                    </Link>

                    <div className="cart-item-body">
                      <p className="cart-item-category">{product?.category || '-'}</p>
                      <Link to={`/products/${productId}`} className="cart-item-name">
                        {product?.name || '상품'}
                      </Link>
                      <p className="cart-item-price">{formatPrice(item.price)}</p>

                      <div className="cart-item-actions">
                        <div className="qty-control">
                          <button
                            type="button"
                            disabled={disabled || item.quantity <= 1}
                            onClick={() => updateQuantity(productId, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => updateQuantity(productId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="cart-remove"
                          disabled={disabled}
                          onClick={() => removeItem(productId)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <strong className="cart-item-total">
                      {formatPrice(item.price * item.quantity)}
                    </strong>
                  </li>
                )
              })}
            </ul>

            <aside className="cart-summary">
              <h2>주문 요약</h2>
              <div className="summary-row">
                <span>총 수량</span>
                <strong>{cart.totalQuantity}개</strong>
              </div>
              <div className="summary-row">
                <span>총 금액</span>
                <strong>{formatPrice(cart.totalPrice)}</strong>
              </div>
              <button
                type="button"
                className="cart-checkout"
                onClick={() => navigate('/checkout')}
              >
                결제하기
              </button>
              <Link to="/" className="cart-keep-shopping">
                쇼핑 계속하기
              </Link>
            </aside>
          </div>
        )}
      </main>

      <AcademyFooter />
    </div>
  )
}
