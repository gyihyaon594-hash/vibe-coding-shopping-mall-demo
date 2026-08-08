import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Navbar from '../components/academy/Navbar'
import AcademyFooter from '../components/academy/AcademyFooter'
import { useAuthUser } from '../hooks/useAuthUser'
import { getStoredToken } from '../utils/authStorage'
import { loadPortone, getPortoneConfig } from '../utils/portone'
import { formatPrice } from '../data/academyData'
import './CheckoutPage.css'
import './MainPage.css'

function notifyCartUpdated(totalQuantity) {
  window.dispatchEvent(
    new CustomEvent('cart:updated', { detail: { totalQuantity } })
  )
}

const STEPS = [
  { id: 1, label: '배송정보' },
  { id: 2, label: '결제' },
  { id: 3, label: '확인' },
]

const PAYMENT_OPTIONS = [
  { value: 'card', label: '신용/체크카드' },
  { value: 'bank', label: '계좌이체' },
  { value: 'kakao', label: '카카오페이' },
  { value: 'naver', label: '네이버페이' },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthUser()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    deliveryRequest: '',
    paymentMethod: 'card',
  })

  // 포트원 V2 SDK 미리 로드 (V2는 별도 init 불필요)
  useEffect(() => {
    loadPortone().catch((err) => {
      console.error('PortOne load error:', err)
      setError(err.message || '결제 모듈 로드에 실패했습니다.')
    })
  }, [])

  useEffect(() => {
    if (!user) return

    setForm((prev) => ({
      ...prev,
      name: prev.name || user.name || '',
      email: prev.email || user.email || '',
      address: prev.address || user.address || '',
    }))
  }, [user])

  useEffect(() => {
    if (!user) return

    let cancelled = false

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
          if (!cancelled) {
            setError(data.message || '장바구니를 불러오지 못했습니다.')
            setCart(null)
          }
          return
        }
        if (!cancelled) setCart(data)
      } catch {
        if (!cancelled) {
          setError('서버에 연결할 수 없습니다.')
          setCart(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCart()
    return () => {
      cancelled = true
    }
  }, [user])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // 결제 수단 → 포트원 V2 payMethod 매핑
  // 카카오페이/네이버페이는 간편결제 전용 채널을 콘솔에 추가로 등록해야 동작함
  const PAY_METHOD_MAP = {
    card: 'CARD',
    bank: 'TRANSFER',
    kakao: 'EASY_PAY',
    naver: 'EASY_PAY',
  }

  async function handlePlaceOrder(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('받는 분을 입력해주세요.')
    if (!form.email.trim()) return setError('이메일을 입력해주세요.')
    if (!form.phone.trim()) return setError('전화번호를 입력해주세요.')
    if (!form.address.trim()) return setError('기본 주소를 입력해주세요.')
    if (!form.paymentMethod) return setError('결제 수단을 선택해주세요.')
    if (!cart?.items?.length) return setError('장바구니가 비어 있습니다.')

    setSubmitting(true)
    try {
      const PortOne = await loadPortone()
      const { storeId, channelKey } = getPortoneConfig()

      const firstProductName = cart.items[0]?.product?.name || '상품'
      const orderName =
        cart.items.length > 1
          ? `${firstProductName} 외 ${cart.items.length - 1}건`
          : firstProductName

      // 포트원 V2 결제창 호출
      const payment = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId: `order_no_${Date.now()}`, // 상점에서 관리하는 주문 번호 (매번 고유해야 함)
        orderName,
        totalAmount: cart.totalPrice,
        currency: 'CURRENCY_KRW',
        payMethod: PAY_METHOD_MAP[form.paymentMethod],
        customer: {
          fullName: form.name.trim(),
          email: form.email.trim(),
          phoneNumber: form.phone.trim(),
        },
        // 모바일에서 결제 완료 후 리디렉션 될 URL
        redirectUrl: `${window.location.origin}/checkout`,
      })

      // V2는 실패/취소 시 code 필드가 채워진 객체를 반환
      if (payment.code !== undefined) {
        setError(payment.message || '결제가 취소되었습니다.')
        return
      }

      // 결제 성공 → 주문 생성
      const token = getStoredToken()
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingInfo: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
            addressDetail: form.addressDetail.trim(),
            zipCode: form.zipCode.trim(),
            deliveryRequest: form.deliveryRequest.trim(),
          },
          paymentInfo: {
            method: form.paymentMethod,
            paymentId: payment.paymentId,
            txId: payment.txId,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        // 결제는 됐지만 주문 생성에 실패한 경우 → 실패 화면으로 이동
        navigate('/order/complete', {
          state: { error: data.message || '주문에 실패했습니다.' },
        })
        return
      }

      // 주문 생성 성공 → 주문 성공 화면으로 이동
      notifyCartUpdated(0)
      navigate('/order/complete', { replace: true, state: { order: data } })
    } catch (err) {
      setError(err.message || '서버에 연결할 수 없습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="checkout-page">
        <Navbar />
        <p className="checkout-status">불러오는 중...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const items = cart?.items || []

  return (
    <div className="checkout-page">
      <Navbar />

      <main className="checkout-main">
        <h1 className="checkout-title">주문하기</h1>

        <ol className="checkout-steps">
          {STEPS.map((step, index) => (
            <li key={step.id} className={step.id <= 2 ? 'active' : ''}>
              {index > 0 && <span className="step-line" aria-hidden="true" />}
              <span className="step-circle">{step.id}</span>
              <span className="step-label">{step.label}</span>
            </li>
          ))}
        </ol>

        {loading ? (
          <p className="checkout-status">주문 정보를 불러오는 중...</p>
        ) : items.length === 0 ? (
          <div className="checkout-empty">
            <p>주문할 상품이 없습니다.</p>
            <Link to="/cart">장바구니로 돌아가기</Link>
          </div>
        ) : (
          <form className="checkout-layout" onSubmit={handlePlaceOrder} noValidate>
            <section className="checkout-form-card">
              <h2>
                <span className="shipping-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 7h11v10H3z" />
                    <path d="M14 10h4l3 3v4h-7V10z" />
                    <circle cx="7" cy="18" r="1.5" />
                    <circle cx="18" cy="18" r="1.5" />
                  </svg>
                </span>
                배송 정보
              </h2>

              <label className="field">
                <span>받는 분</span>
                <input
                  name="name"
                  type="text"
                  placeholder="받는 분 성함"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="field">
                <span>이메일</span>
                <div className="input-with-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  <input
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>

              <label className="field">
                <span>전화번호</span>
                <div className="input-with-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 3h3l2 5-2 1a10 10 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" />
                  </svg>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="010-1234-5678"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>

              <div className="field-row field-row--zip">
                <label className="field">
                  <span>
                    우편번호 <em className="optional">(선택)</em>
                  </span>
                  <input
                    name="zipCode"
                    type="text"
                    placeholder="12345"
                    value={form.zipCode}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <label className="field">
                <span>기본 주소</span>
                <div className="input-with-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  <input
                    name="address"
                    type="text"
                    placeholder="도로명 또는 지번 주소"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>

              <label className="field">
                <span>상세 주소</span>
                <input
                  name="addressDetail"
                  type="text"
                  placeholder="동·호수 등 상세 주소"
                  value={form.addressDetail}
                  onChange={handleChange}
                />
              </label>

              <label className="field">
                <span>
                  배송 요청사항 <em className="optional">(선택)</em>
                </span>
                <textarea
                  name="deliveryRequest"
                  rows="3"
                  placeholder="배송 시 요청사항을 입력해주세요"
                  value={form.deliveryRequest}
                  onChange={handleChange}
                />
              </label>
            </section>

            <section className="checkout-form-card checkout-payment-card">
              <h2>
                <span className="shipping-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </span>
                결제 정보
              </h2>

              <fieldset className="payment-methods">
                <legend>결제 수단</legend>
                <div className="payment-method-options">
                  {PAYMENT_OPTIONS.map((option) => (
                    <label key={option.value} className="payment-method-option">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={form.paymentMethod === option.value}
                        onChange={handleChange}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <p className="payment-hint">
                주문하기를 누르면 포트원 결제창이 열립니다. 카드 정보 등 결제 정보는
                결제창에서 안전하게 입력됩니다.
              </p>

              {error && <p className="checkout-error">{error}</p>}
            </section>

            <aside className="checkout-summary">
              <h2>주문 요약</h2>

              <ul className="summary-items">
                {items.map((item) => {
                  const product = item.product
                  const productId = product?._id || item.product
                  return (
                    <li key={productId}>
                      <div className="summary-thumb">
                        {product?.image ? (
                          <img src={product.image} alt={product.name || '상품'} />
                        ) : (
                          <span />
                        )}
                      </div>
                      <div className="summary-item-meta">
                        <strong>{product?.name || '상품'}</strong>
                        <span>
                          {product?.category || '-'} · 수량 {item.quantity}
                        </span>
                      </div>
                      <em>{formatPrice(item.price * item.quantity)}</em>
                    </li>
                  )
                })}
              </ul>

              <div className="summary-lines">
                <div>
                  <span>상품 금액 ({cart.totalQuantity}개)</span>
                  <strong>{formatPrice(cart.totalPrice)}</strong>
                </div>
                <div>
                  <span>배송비</span>
                  <strong className="free">무료</strong>
                </div>
              </div>

              <div className="summary-total">
                <span>총 결제금액</span>
                <strong>{formatPrice(cart.totalPrice)}</strong>
              </div>

              <button type="submit" className="place-order-button" disabled={submitting}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                {submitting ? '주문 처리 중...' : '주문하기'}
              </button>

              <p className="secure-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                안전한 결제 환경에서 처리됩니다
              </p>

              <div className="pay-badges" aria-hidden="true">
                <span>VISA</span>
                <span>MC</span>
                <span>AMEX</span>
                <span>PAYPAL</span>
              </div>

              <p className="terms-note">주문하기를 누르면 이용약관에 동의한 것으로 간주됩니다.</p>

              <Link to="/cart" className="back-to-cart">
                ← 장바구니로 돌아가기
              </Link>
            </aside>
          </form>
        )}
      </main>

      <AcademyFooter />
    </div>
  )
}
