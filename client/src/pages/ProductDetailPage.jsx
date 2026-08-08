import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/academy/Navbar'
import AcademyFooter from '../components/academy/AcademyFooter'
import { formatPrice } from '../data/academyData'
import { getStoredToken } from '../utils/authStorage'
import './ProductDetailPage.css'
import './MainPage.css'

const DETAIL_NAV = [
  { id: 'overview', label: '소개' },
  { id: 'features', label: '특징' },
  { id: 'curriculum', label: '커리큘럼' },
  { id: 'faq', label: 'FAQ' },
]

const FEATURES = [
  {
    title: '실무 중심 커리큘럼',
    desc: '현장에서 바로 적용할 수 있는 사례와 프로토콜 중심으로 구성했습니다.',
  },
  {
    title: '전문가 피드백',
    desc: '연구·임상 전문가의 해설과 Q&A로 막히는 지점을 빠르게 해소합니다.',
  },
  {
    title: '수료 후 활용',
    desc: '수료증과 복습 자료로 기관 보고·연구 설계에 바로 활용할 수 있습니다.',
  },
]

const CURRICULUM = [
  {
    title: '기초 개념 정리',
    lessons: ['과정 목표와 학습 로드맵', '핵심 용어와 프레임워크', '실습 환경 준비'],
  },
  {
    title: '실무 적용 워크플로우',
    lessons: ['케이스 기반 해석 실습', '보고서 작성 포인트', '자주 하는 실수와 교정'],
  },
  {
    title: '심화 · 확장',
    lessons: ['고급 해석 시나리오', '팀 협업 체크리스트', '수료 후 학습 가이드'],
  },
]

const FAQS = [
  {
    q: '수강 기간은 어떻게 되나요?',
    a: '결제 후 90일간 무제한으로 다시보기할 수 있습니다. 기간 내 완강을 권장합니다.',
  },
  {
    q: '초보도 수강할 수 있나요?',
    a: '입문 수준부터 차근차근 설명합니다. 카테고리별 선수 지식이 있다면 더 빠르게 따라올 수 있습니다.',
  },
  {
    q: '수료증은 발급되나요?',
    a: '진도율 조건을 충족하면 디지털 수료증을 발급받을 수 있습니다.',
  },
  {
    q: '환불 정책은 어떻게 되나요?',
    a: '수강 시작 후 7일 이내, 진도율 10% 미만일 때 전액 환불이 가능합니다.',
  },
]

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openCurriculum, setOpenCurriculum] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/products/${id}`)
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) {
            setError(data.message || '상품을 불러오지 못했습니다.')
            setProduct(null)
          }
          return
        }
        if (!cancelled) setProduct(data)
      } catch {
        if (!cancelled) {
          setError('서버에 연결할 수 없습니다.')
          setProduct(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProduct()
    return () => {
      cancelled = true
    }
  }, [id])

  function scrollTo(sectionId) {
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleAddToCart() {
    const token = getStoredToken()
    if (!token) {
      navigate('/login')
      return
    }

    setAddingToCart(true)
    setCartMessage('')
    try {
      const res = await fetch('/api/carts/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCartMessage(data.message || '장바구니 추가에 실패했습니다.')
        return
      }

      window.dispatchEvent(
        new CustomEvent('cart:updated', {
          detail: { totalQuantity: data.totalQuantity || 0 },
        })
      )
      setCartMessage('장바구니에 담았습니다.')
    } catch {
      setCartMessage('서버에 연결할 수 없습니다.')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <p className="detail-status">상품을 불러오는 중...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <div className="detail-status-wrap">
          <p className="detail-status detail-status--error">{error || '상품을 찾을 수 없습니다.'}</p>
          <Link to="/" className="detail-back-link">
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const originalPrice = Math.round(product.price * 1.35)

  return (
    <div className="product-detail-page">
      <Navbar />

      <nav className="detail-subnav" aria-label="상품 상세 메뉴">
        <div className="detail-subnav-inner">
          {DETAIL_NAV.map((item) => (
            <button key={item.id} type="button" onClick={() => scrollTo(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <section className="detail-hero" id="overview">
        <div className="detail-hero-inner">
          <div className="detail-media">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="detail-media-fallback" />
            )}
          </div>

          <aside className="detail-purchase">
            <span className="detail-badge">{product.category}</span>
            <h1>{product.name}</h1>
            <p className="detail-sku">SKU {product.sku}</p>
            <p className="detail-lead">
              {product.description ||
                '현장에서 바로 쓰는 실무 중심 강의로, 핵심 개념부터 적용까지 한 번에 정리합니다.'}
            </p>

            <div className="detail-price-box">
              <span className="detail-original">{formatPrice(originalPrice)}</span>
              <div className="detail-price-row">
                <span className="detail-discount">26%</span>
                <strong>{formatPrice(product.price)}</strong>
              </div>
            </div>

            <button type="button" className="detail-cta-primary">
              수강 신청하기
            </button>
            <button
              type="button"
              className="detail-cta-secondary"
              onClick={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart ? '담는 중...' : '관심 과정 담기'}
            </button>
            {cartMessage && <p className="detail-cart-message">{cartMessage}</p>}

            <ul className="detail-perks">
              <li>90일 무제한 다시보기</li>
              <li>수료증 발급</li>
              <li>실습 자료 제공</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="detail-promo">
        <div className="detail-promo-inner">
          <p className="detail-promo-eyebrow">WHY THIS COURSE</p>
          <h2>
            이론만 듣고 끝내지 마세요.
            <br />
            <span>실무에서 바로 쓰는</span> 해석 프레임을 만듭니다.
          </h2>
          <p>
            {product.category}에 맞춘 커리큘럼으로, 핵심 개념·케이스 실습·보고 작성까지
            한 흐름으로 학습합니다.
          </p>
        </div>
      </section>

      <section className="detail-features" id="features">
        <div className="detail-section-inner">
          <h2>이 과정에서 얻는 것</h2>
          <div className="detail-feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="detail-feature-card">
                <span className="detail-feature-mark" aria-hidden="true" />
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="detail-showcase">
        <div className="detail-section-inner detail-showcase-grid">
          <div>
            <p className="detail-eyebrow">LEARNING OUTCOME</p>
            <h2>
              수강 후,
              <br />
              이렇게 달라집니다
            </h2>
            <ul>
              <li>핵심 지표를 구조적으로 읽고 설명할 수 있습니다</li>
              <li>팀/보호자/연구 파트너와 같은 언어로 소통합니다</li>
              <li>케이스별 의사결정 체크리스트를 직접 운영합니다</li>
            </ul>
          </div>
          <div className="detail-showcase-panel">
            {product.image ? (
              <img src={product.image} alt="" />
            ) : (
              <div className="detail-media-fallback" />
            )}
          </div>
        </div>
      </section>

      <section className="detail-curriculum" id="curriculum">
        <div className="detail-section-inner">
          <p className="detail-eyebrow">CURRICULUM</p>
          <h2>커리큘럼</h2>
          <div className="detail-accordion">
            {CURRICULUM.map((module, index) => {
              const open = openCurriculum === index
              return (
                <div key={module.title} className={`detail-acc-item ${open ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="detail-acc-trigger"
                    onClick={() => setOpenCurriculum(open ? -1 : index)}
                  >
                    <span>
                      {index + 1}. {module.title}
                    </span>
                    <span aria-hidden="true">{open ? '−' : '+'}</span>
                  </button>
                  {open && (
                    <ul className="detail-acc-body">
                      {module.lessons.map((lesson) => (
                        <li key={lesson}>{lesson}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="detail-faq" id="faq">
        <div className="detail-section-inner">
          <p className="detail-eyebrow">FAQ</p>
          <h2>자주 묻는 질문</h2>
          <div className="detail-accordion">
            {FAQS.map((item, index) => {
              const open = openFaq === index
              return (
                <div key={item.q} className={`detail-acc-item ${open ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="detail-acc-trigger"
                    onClick={() => setOpenFaq(open ? -1 : index)}
                  >
                    <span>{item.q}</span>
                    <span aria-hidden="true">{open ? '−' : '+'}</span>
                  </button>
                  {open && <p className="detail-faq-answer">{item.a}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="detail-final-cta">
        <div className="detail-final-inner">
          <h2>{product.name}</h2>
          <p>지금 시작하고, 90일 안에 실무 흐름을 내 것으로 만드세요.</p>
          <div className="detail-final-actions">
            <strong>{formatPrice(product.price)}</strong>
            <button type="button" className="detail-cta-primary">
              수강 신청하기
            </button>
          </div>
        </div>
      </section>

      <AcademyFooter />
    </div>
  )
}
