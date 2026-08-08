import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/academyData'

const PRODUCT_FILTERS = [
  { id: 'all', label: '전체' },
  { id: '임상가 과정', label: '임상가 과정' },
  { id: '보호자 과정', label: '보호자 과정' },
  { id: '연구자 과정', label: '연구자 과정' },
]

function ProductCard({ product }) {
  return (
    <Link to={`/products/${product._id}`} className="course-card course-card-link">
      <div className="course-thumb course-thumb--image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="course-thumb-fallback" />
        )}
        <span className="course-code">{product.sku}</span>
      </div>
      <div className="course-body">
        <p className="course-meta">{product.category}</p>
        <h3>{product.name}</h3>
        {product.description && <p className="course-desc">{product.description}</p>}
        <div className="course-divider" />
        <div className="course-footer">
          <div className="price-block">
            <strong>{formatPrice(product.price)}</strong>
          </div>
          <span className="btn-detail">자세히 보기 →</span>
        </div>
      </div>
    </Link>
  )
}

export default function CourseSection({ products = [], loading = false, error = '' }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const filters = useMemo(() => {
    return PRODUCT_FILTERS.map((filter) => ({
      ...filter,
      count:
        filter.id === 'all'
          ? products.length
          : products.filter((product) => product.category === filter.id).length,
    }))
  }, [products])

  const filteredProducts =
    activeFilter === 'all'
      ? products
      : products.filter((product) => product.category === activeFilter)

  return (
    <section className="courses" id="courses">
      <div className="section-inner">
        <div className="courses-header">
          <div>
            <p className="eyebrow">COURSES</p>
            <h2>연구실에서 임상까지, 바로 쓰는 강의</h2>
            <p className="section-desc">
              ATN · 의료 AI · 인지중재 · 유전체까지. 역할에 맞는 과정을 골라 수강하세요.
            </p>
          </div>
          <button type="button" className="btn-outline">
            전체 {products.length}개 과정 보기
          </button>
        </div>

        <div className="filter-tabs">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              className={activeFilter === filter.id ? 'active' : ''}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label} {filter.count}
            </button>
          ))}
        </div>

        {loading && <p className="courses-status">상품을 불러오는 중...</p>}
        {!loading && error && <p className="courses-status courses-status--error">{error}</p>}
        {!loading && !error && filteredProducts.length === 0 && (
          <p className="courses-status">등록된 상품이 없습니다.</p>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="course-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
