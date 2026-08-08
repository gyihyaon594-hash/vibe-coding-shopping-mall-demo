import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthUser } from '../../hooks/useAuthUser'
import { getStoredToken } from '../../utils/authStorage'
import { formatPrice } from '../../data/academyData'
import './AdminOrderPage.css'

const STATUS_META = {
  pending: { label: '결제 대기', className: 'ao-status--pending' },
  paid: { label: '주문확인', className: 'ao-status--paid' },
  preparing: { label: '상품준비중', className: 'ao-status--preparing' },
  shipped: { label: '배송시작', className: 'ao-status--shipped' },
  delivering: { label: '배송중', className: 'ao-status--delivering' },
  delivered: { label: '배송완료', className: 'ao-status--delivered' },
  cancelled: { label: '주문취소', className: 'ao-status--cancelled' },
}

// 상태 필터 탭 — Order 스키마의 모든 상태값 표시
const TABS = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '결제 대기' },
  { value: 'paid', label: '주문확인' },
  { value: 'preparing', label: '상품준비중' },
  { value: 'shipped', label: '배송시작' },
  { value: 'delivering', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '주문취소' },
]

// 상태 변경 콤보박스 옵션
const STATUS_OPTIONS = [
  { value: 'pending', label: '결제 대기' },
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

export default function AdminOrderPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthUser()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    if (!user || user.user_type !== 'admin') return

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
    let result = orders

    if (tab !== 'all') {
      result = result.filter((order) => order.status === tab)
    }

    const keyword = search.trim().toLowerCase()
    if (keyword) {
      result = result.filter((order) => {
        const orderNumber = order.orderNumber?.toLowerCase() || ''
        const userName = order.user?.name?.toLowerCase() || ''
        const shippingName = order.shippingInfo?.name?.toLowerCase() || ''
        return (
          orderNumber.includes(keyword) ||
          userName.includes(keyword) ||
          shippingName.includes(keyword)
        )
      })
    }

    return result
  }, [orders, tab, search])

  // 탭별 주문 개수
  const tabCounts = useMemo(() => {
    const counts = { all: orders.length }
    for (const order of orders) {
      counts[order.status] = (counts[order.status] || 0) + 1
    }
    return counts
  }, [orders])

  async function updateStatus(orderId, status) {
    setUpdatingId(orderId)
    setError('')
    try {
      const token = getStoredToken()
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '주문 상태 변경에 실패했습니다.')
        return
      }
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? data : order))
      )
    } catch {
      setError('서버에 연결할 수 없습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (authLoading) {
    return <div className="ao-loading">불러오는 중...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.user_type !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="ao-page">
      <header className="ao-topbar">
        <button
          type="button"
          className="ao-back"
          onClick={() => navigate('/admin')}
          aria-label="관리자 대시보드로 돌아가기"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h1>주문 관리</h1>
      </header>

      <main className="ao-main">
        <section className="ao-toolbar">
          <div className="ao-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="주문번호 또는 고객명으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ao-tabs" role="tablist">
            {TABS.map((t) => {
              const count = tabCounts[t.value] || 0
              return (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.value}
                  className={`ao-tab ${tab === t.value ? 'ao-tab--active' : ''}`}
                  onClick={() => setTab(t.value)}
                >
                  {t.label}
                  {count > 0 && <span className="ao-tab-count">{count}</span>}
                </button>
              )
            })}
          </div>
        </section>

        {error && <p className="ao-status-msg ao-status-msg--error">{error}</p>}
        {loading && <p className="ao-status-msg">주문 목록을 불러오는 중...</p>}

        {!loading && filteredOrders.length === 0 && (
          <p className="ao-status-msg">표시할 주문이 없습니다.</p>
        )}

        {!loading && filteredOrders.length > 0 && (
          <ul className="ao-list">
            {filteredOrders.map((order) => {
              const status = STATUS_META[order.status] || STATUS_META.pending
              const shipping = order.shippingInfo || {}
              const customerName = order.user?.name || shipping.name || '-'
              const expanded = expandedId === order._id

              return (
                <li key={order._id} className="ao-card">
                  <div className="ao-card-head">
                    <div className="ao-card-title">
                      <span className="ao-card-clock" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                      </span>
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <span>
                          {customerName} · {shipping.email || order.user?.email || '-'}
                        </span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <span className={`ao-status ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="ao-card-cols">
                    <div>
                      <span className="ao-col-label">주문 상품</span>
                      {order.items?.map((item, index) => (
                        <p key={item.product?._id || index}>
                          {item.product?.name || '상품'}
                          {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                        </p>
                      ))}
                    </div>
                    <div>
                      <span className="ao-col-label">배송 주소</span>
                      <p>{shipping.name}</p>
                      <p>{shipping.phone || '-'}</p>
                      <p>
                        {shipping.address}
                        {shipping.addressDetail ? ` ${shipping.addressDetail}` : ''}
                      </p>
                    </div>
                  </div>

                  {expanded && (
                    <div className="ao-card-detail">
                      <span className="ao-col-label">주문 상품 상세</span>
                      <ul>
                        {order.items?.map((item, index) => {
                          const product = item.product || {}
                          return (
                            <li key={product._id || index}>
                              <div className="ao-item-thumb">
                                {product.image ? (
                                  <img src={product.image} alt={product.name || '상품'} />
                                ) : (
                                  <span aria-hidden="true" />
                                )}
                              </div>
                              <div className="ao-item-info">
                                <strong>{product.name || '상품'}</strong>
                                <span>
                                  수량: {item.quantity} · {formatPrice(item.price)}
                                </span>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                      {shipping.deliveryRequest && (
                        <p className="ao-delivery-request">
                          배송 요청사항: {shipping.deliveryRequest}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="ao-card-foot">
                    <select
                      className="ao-select"
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) => {
                        if (e.target.value !== order.status) {
                          updateStatus(order._id, e.target.value)
                        }
                      }}
                      aria-label="주문 상태 변경"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <div className="ao-card-foot-right">
                      <strong className="ao-card-price">
                        {formatPrice(order.totalPrice)}
                      </strong>
                      <button
                        type="button"
                        className="ao-detail-btn"
                        onClick={() => setExpandedId(expanded ? null : order._id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        상세보기
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
