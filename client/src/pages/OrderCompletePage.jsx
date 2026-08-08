import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/academy/Navbar'
import AcademyFooter from '../components/academy/AcademyFooter'
import { formatPrice } from '../data/academyData'
import './OrderCompletePage.css'
import './MainPage.css'

function formatOrderDate(dateString) {
  const date = dateString ? new Date(dateString) : new Date()
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function OrderCompletePage() {
  const location = useLocation()
  const order = location.state?.order || null
  const errorMessage = location.state?.error || ''
  const isSuccess = Boolean(order)

  // 주소로 직접 접근하는 등 주문 정보가 없는 경우
  if (!order && !errorMessage) {
    return (
      <div className="order-complete-page">
        <Navbar />
        <main className="order-complete-main">
          <div className="order-result order-result--empty">
            <p>표시할 주문 정보가 없습니다.</p>
            <Link to="/" className="order-btn order-btn--primary">
              메인으로 돌아가기
            </Link>
          </div>
        </main>
        <AcademyFooter />
      </div>
    )
  }

  return (
    <div className="order-complete-page">
      <Navbar />

      <header className="order-complete-header">Order Confirmation</header>

      <main className="order-complete-main">
        {isSuccess ? (
          <>
            <div className="order-result">
              <span className="order-result-icon order-result-icon--success" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m8 12.5 2.5 2.5L16 9.5" />
                </svg>
              </span>
              <h1>주문이 성공적으로 완료되었습니다!</h1>
              <p>주문해 주셔서 감사합니다.</p>
              <p>주문 확인 이메일을 곧 받으실 수 있습니다.</p>
            </div>

            <section className="order-info-card">
              <h2>
                <span className="order-info-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7z" />
                    <path d="M3 8.5 12 14l9-5.5" />
                    <path d="M12 14v7" />
                  </svg>
                </span>
                주문 정보
              </h2>

              <div className="order-info-meta">
                <div>
                  <span className="order-info-label">주문 번호</span>
                  <span className="order-info-value">{order.orderNumber}</span>
                </div>
                <div>
                  <span className="order-info-label">주문 날짜</span>
                  <span className="order-info-value">{formatOrderDate(order.createdAt)}</span>
                </div>
              </div>

              <div className="order-info-items">
                <span className="order-info-label">주문 상품</span>
                <ul>
                  {order.items?.map((item, index) => {
                    const product = item.product || {}
                    return (
                      <li key={product._id || index} className="order-item">
                        <div className="order-item-thumb">
                          {product.image ? (
                            <img src={product.image} alt={product.name || '상품'} />
                          ) : (
                            <span className="order-item-thumb-placeholder" aria-hidden="true" />
                          )}
                        </div>
                        <div className="order-item-info">
                          <strong>{product.name || '상품'}</strong>
                          <span>수량: {item.quantity}</span>
                          <em>{formatPrice(item.price)}</em>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="order-info-total">
                <span>총 금액</span>
                <strong>{formatPrice(order.totalPrice)}</strong>
              </div>
            </section>

            <div className="order-actions">
              <Link to="/orders" className="order-btn order-btn--primary">
                주문 목록 보기
              </Link>
              <Link to="/" className="order-btn order-btn--ghost">
                쇼핑 계속하기
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="order-result">
              <span className="order-result-icon order-result-icon--fail" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 9 6 6M15 9l-6 6" />
                </svg>
              </span>
              <h1>주문에 실패했습니다</h1>
              <p>{errorMessage}</p>
              <p>결제가 완료되었는데 주문이 실패한 경우 고객센터로 문의해주세요.</p>
            </div>

            <div className="order-actions">
              <Link to="/checkout" className="order-btn order-btn--primary">
                다시 시도하기
              </Link>
              <Link to="/cart" className="order-btn order-btn--ghost">
                장바구니로 돌아가기
              </Link>
            </div>
          </>
        )}
      </main>

      <AcademyFooter />
    </div>
  )
}
