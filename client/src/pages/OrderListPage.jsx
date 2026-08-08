import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/academy/Navbar'
import AcademyFooter from '../components/academy/AcademyFooter'
import { useAuthUser } from '../hooks/useAuthUser'
import { getStoredToken } from '../utils/authStorage'
import { formatPrice } from '../data/academyData'
import './OrderListPage.css'
import './MainPage.css'

const STATUS_META = {
  pending: { label: '결제 대기', className: 'order-status--pending' },
  paid: { label: '주문확인', className: 'order-status--paid' },
  preparing: { label: '상품준비중', className: 'order-status--preparing' },
  shipped: { label: '배송시작', className: 'order-status--shipped' },
  delivering: { label: '배송중', className: 'order-status--delivering' },
  delivered: { label: '배송완료', className: 'order-status--delivered' },
  cancelled: { label: '주문취소', className: 'order-status--cancelled' },
}

const TABS = [
  { value: 'all', label: '전체' },
  { value: 'paid', label: '주문확인' },
  { value: 'preparing', label: '상품준비중' },
  { value: 'shipped', label: '배송시작' },
  { value: 'delivering', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '주문취소' },
]

function formatDate(dateString) {
  const d = new Date(dateString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 예상 배송일: 주문일 + 5일 ~ + 7일
function getDeliveryRange(dateString) {
  const base = new Date(dateString)
  const from = new Date(base)
  from.setDate(from.getDate() + 5)
  const to = new Date(base)
  to.setDate(to.getDate() + 7)
  const opts = { year: 'numeric', month: 'long', day: 'numeric' }
  return `${from.toLocaleDateString('ko-KR', opts)} - ${to.toLocaleDateString('ko-KR', opts)}`
}

export default function OrderListPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthUser()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function loadOrders() {
      setLoading(true)
      setError('')
      try {
        const token = getStoredToken()
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) setError(data.message || '주문 목록을 불러오지 못했습니다.')
          return
        }
        if (!cancelled) setOrders(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setError('서버에 연결할 수 없습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOrders()
    return () => {
      cancelled = true
    }
  }, [user])

  const filteredOrders = useMemo(() => {
    if (tab === 'all') return orders
    return orders.filter((order) => order.status === tab)
  }, [orders, tab])

  // 탭별 주문 개수
  const tabCounts = useMemo(() => {
    const counts = { all: orders.length }
    for (const order of orders) {
      counts[order.status] = (counts[order.status] || 0) + 1
    }
    return counts
  }, [orders])

  if (authLoading) {
    return (
      <div className="order-list-page">
        <Navbar />
        <p className="order-list-status">불러오는 중...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="order-list-page">
      <Navbar />

      <header className="order-list-header">
        <button
          type="button"
          className="order-list-back"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h1>주문 내역</h1>
      </header>

      <main className="order-list-main">
        <div className="order-tabs" role="tablist">
          {TABS.map((t) => {
            const count = tabCounts[t.value] || 0
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={tab === t.value}
                className={`order-tab ${tab === t.value ? 'order-tab--active' : ''}`}
                onClick={() => setTab(t.value)}
              >
                {t.label}
                {count > 0 && <span className="order-tab-count">{count}</span>}
              </button>
            )
          })}
        </div>

        {loading && <p className="order-list-status">주문 목록을 불러오는 중...</p>}
        {!loading && error && (
          <p className="order-list-status order-list-status--error">{error}</p>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="order-list-empty">
            <p>
              {tab === 'all'
                ? '아직 주문 내역이 없습니다.'
                : '해당 상태의 주문이 없습니다.'}
            </p>
            <Link to="/" className="order-list-btn">
              쇼핑하러 가기
            </Link>
          </div>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <ul className="order-list">
            {filteredOrders.map((order) => {
              const status = STATUS_META[order.status] || STATUS_META.pending
              return (
                <li key={order._id} className="order-card">
                  <div className="order-card-head">
                    <div className="order-card-head-left">
                      <span className="order-card-clock" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                      </span>
                      <div>
                        <strong className="order-card-number">
                          주문 #{order.orderNumber}
                        </strong>
                        <span className="order-card-date">
                          주문일: {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="order-card-head-right">
                      <span className={`order-status ${status.className}`}>
                        {status.label}
                      </span>
                      <strong className="order-card-total">
                        {formatPrice(order.totalPrice)}
                      </strong>
                    </div>
                  </div>

                  <ul className="order-card-items">
                    {order.items?.map((item, index) => {
                      const product = item.product || {}
                      return (
                        <li key={product._id || index}>
                          <div className="order-card-thumb">
                            {product.image ? (
                              <img src={product.image} alt={product.name || '상품'} />
                            ) : (
                              <span aria-hidden="true" />
                            )}
                          </div>
                          <div className="order-card-item-info">
                            <strong>{product.name || '상품'}</strong>
                            {(product.category || product.sku) && (
                              <span className="order-card-item-sub">
                                {[product.category, product.sku]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            )}
                            <span>수량: {item.quantity}</span>
                            <em>{formatPrice(item.price)}</em>
                          </div>
                        </li>
                      )
                    })}
                  </ul>

                  {['paid', 'preparing', 'shipped', 'delivering'].includes(order.status) && (
                    <div className="order-card-delivery">
                      <span aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                      </span>
                      예상 배송일: {getDeliveryRange(order.createdAt)}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <AcademyFooter />
    </div>
  )
}
