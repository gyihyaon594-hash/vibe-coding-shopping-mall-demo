import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser'
import { getStoredToken } from '../utils/authStorage'
import './ProductListPage.css'

const CATEGORIES = ['전체', '임상가 과정', '보호자 과정', '연구자 과정']
const PAGE_SIZE = 2

function formatPrice(price) {
  return `₩${Number(price).toLocaleString('ko-KR')}`
}

export default function ProductListPage() {
  const { user, loading: authLoading } = useAuthUser()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const [showFilter, setShowFilter] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      })
      if (category !== '전체') {
        params.set('category', category)
      }

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '상품 목록을 불러오지 못했습니다.')
        setProducts([])
        return
      }

      setProducts(Array.isArray(data.products) ? data.products : [])
      if (data.pagination) {
        setPagination(data.pagination)
        if (page > data.pagination.totalPages) {
          setPage(data.pagination.totalPages)
        }
      }
    } catch {
      setError('서버에 연결할 수 없습니다.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [category, page])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((product) => product.name.toLowerCase().includes(q))
  }, [products, search])

  async function handleDelete(product) {
    const ok = window.confirm(`"${product.name}" 상품을 삭제할까요?`)
    if (!ok) return

    setDeletingId(product._id)
    setError('')
    try {
      const token = getStoredToken()
      const res = await fetch(`/api/products/${product._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '삭제에 실패했습니다.')
        return
      }

      if (products.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      } else {
        fetchProducts()
      }
    } catch {
      setError('서버에 연결할 수 없습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  if (authLoading) {
    return <div className="product-list-loading">불러오는 중...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.user_type !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="product-list-page">
      <header className="product-list-topbar">
        <div className="topbar-left">
          <Link to="/admin" className="back-icon" aria-label="대시보드로 돌아가기">
            ←
          </Link>
          <h1>상품 관리</h1>
        </div>
        <Link to="/admin/products/new" className="new-product-button">
          + 새 상품 등록
        </Link>
      </header>

      <div className="product-list-tabs">
        <Link to="/admin/products" className="tab active">
          상품 목록
        </Link>
        <Link to="/admin/products/new" className="tab">
          상품 등록
        </Link>
      </div>

      <main className="product-list-main">
        <div className="toolbar">
          <label className="search-box">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="상품명으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div className="filter-wrap">
            <button
              type="button"
              className={`filter-button ${showFilter ? 'active' : ''}`}
              onClick={() => setShowFilter((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              필터
            </button>
            {showFilter && (
              <div className="filter-panel">
                <p className="filter-label">카테고리</p>
                <div className="filter-options">
                  {CATEGORIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`filter-option ${category === item ? 'selected' : ''}`}
                      onClick={() => {
                        setCategory(item)
                        setPage(1)
                        setShowFilter(false)
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="list-error">{error}</p>}

        <div className="table-card">
          {loading ? (
            <p className="table-empty">상품을 불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p className="table-empty">등록된 상품이 없습니다.</p>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>상품명</th>
                  <th>SKU</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="thumb">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <span className="thumb-placeholder" />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="name-block">
                        <span className="name-cell">{product.name}</span>
                        {product.description && (
                          <span className="desc-cell">{product.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="sku-cell">{product.sku}</td>
                    <td className="category-cell">{product.category}</td>
                    <td className="price-cell">{formatPrice(product.price)}</td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="icon-button" aria-label="수정" title="수정">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 20h4l10-10-4-4L4 16v4z" />
                            <path d="M13 7l4 4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          aria-label="삭제"
                          title="삭제"
                          disabled={deletingId === product._id}
                          onClick={() => handleDelete(product)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M4 7h16" />
                            <path d="M9 7V5h6v2" />
                            <path d="M7 7l1 12h8l1-12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && pagination.total > 0 && (
          <div className="pagination">
            <button
              type="button"
              className="page-button"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              이전
            </button>
            <span className="page-info">
              {pagination.page} / {pagination.totalPages}
              <span className="page-total">총 {pagination.total}개</span>
            </span>
            <button
              type="button"
              className="page-button"
              disabled={!pagination.hasNext}
              onClick={() => setPage((prev) => prev + 1)}
            >
              다음
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
