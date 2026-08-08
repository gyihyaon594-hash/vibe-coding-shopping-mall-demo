import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser'
import { getStoredToken } from '../utils/authStorage'
import { getCloudinaryConfig, loadCloudinary } from '../utils/cloudinary'
import './ProductCreatePage.css'

const CATEGORIES = ['임상가 과정', '보호자 과정', '연구자 과정']

export default function ProductCreatePage() {
  const navigate = useNavigate()
  const { user, loading } = useAuthUser()
  const widgetRef = useRef(null)
  const [form, setForm] = useState({
    sku: '',
    name: '',
    price: '0',
    category: '',
    description: '',
  })
  const [imageUrl, setImageUrl] = useState('')
  const [imageName, setImageName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function openUploadWidget() {
    setError('')
    const config = getCloudinaryConfig()
    if (!config) {
      setError(
        'Cloudinary 설정이 없습니다. client/.env에 VITE_CLOUDINARY_CLOUD_NAME과 VITE_CLOUDINARY_UPLOAD_PRESET을 추가하세요.'
      )
      return
    }

    try {
      const cloudinary = await loadCloudinary()

      if (!widgetRef.current) {
        widgetRef.current = cloudinary.createUploadWidget(
          {
            cloudName: config.cloudName,
            uploadPreset: config.uploadPreset,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            folder: 'khu-dementia/products',
            maxFileSize: 5_000_000,
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            cropping: false,
            styles: {
              palette: {
                window: '#FFFFFF',
                windowBorder: '#E5E5E5',
                tabIcon: '#111111',
                menuIcons: '#555555',
                textDark: '#111111',
                textLight: '#FFFFFF',
                link: '#1D4ED8',
                action: '#111111',
                inactiveTabIcon: '#999999',
                error: '#C0392B',
                inProgress: '#1D4ED8',
                complete: '#16A34A',
                sourceBg: '#F7F7F8',
              },
            },
          },
          (uploadError, result) => {
            if (uploadError) {
              setUploading(false)
              setError(uploadError.message || '이미지 업로드에 실패했습니다.')
              return
            }

            if (result?.event === 'queues-start') {
              setUploading(true)
            }

            if (result?.event === 'success') {
              const url = result.info.secure_url
              setImageUrl(url)
              setImageName(result.info.original_filename || 'uploaded-image')
              setUploading(false)
              setError('')
            }

            if (result?.event === 'close') {
              setUploading(false)
            }
          }
        )
      }

      widgetRef.current.open()
    } catch (err) {
      setUploading(false)
      setError(err.message || 'Cloudinary 위젯을 열 수 없습니다.')
    }
  }

  function clearImage() {
    setImageUrl('')
    setImageName('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.sku.trim()) return setError('SKU를 입력해주세요.')
    if (!form.name.trim()) return setError('상품명을 입력해주세요.')
    if (form.price === '' || Number(form.price) < 0) {
      return setError('판매가격을 올바르게 입력해주세요.')
    }
    if (!form.category) return setError('카테고리를 선택해주세요.')
    if (!imageUrl) return setError('메인 이미지를 업로드해주세요.')

    setSubmitting(true)
    try {
      const token = getStoredToken()

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sku: form.sku.trim(),
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          image: imageUrl,
          description: form.description.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '상품 등록에 실패했습니다.')
        return
      }

      navigate('/admin/products')
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="product-create-loading">불러오는 중...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.user_type !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="product-create-page">
      <header className="product-create-topbar">
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

      <div className="product-create-tabs">
        <Link to="/admin/products" className="tab">
          상품 목록
        </Link>
        <Link to="/admin/products/new" className="tab active">
          상품 등록
        </Link>
      </div>

      <main className="product-create-main">
        <form className="product-form-card" onSubmit={handleSubmit} noValidate>
          <h2>새 상품 등록</h2>

          <div className="form-grid">
            <div className="form-col">
              <div className="field">
                <label htmlFor="name">상품명</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="상품명을 입력하세요"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="sku">SKU</label>
                <input
                  id="sku"
                  name="sku"
                  type="text"
                  placeholder="예: CLN-001"
                  value={form.sku}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="price">판매가격</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="category">카테고리</label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">카테고리 선택</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-col">
              <div className="field">
                <label htmlFor="description">상품 설명</label>
                <textarea
                  id="description"
                  name="description"
                  rows="8"
                  placeholder="상품에 대한 자세한 설명을 입력하세요"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label>메인 이미지</label>
                <div className="file-row">
                  <button
                    type="button"
                    className="file-button"
                    onClick={openUploadWidget}
                    disabled={uploading}
                  >
                    {uploading ? '업로드 중...' : 'Cloudinary로 업로드'}
                  </button>
                  <span className="file-name">
                    {imageName || (imageUrl ? '이미지 업로드 완료' : '선택된 파일 없음')}
                  </span>
                  {imageUrl && (
                    <button type="button" className="clear-image-button" onClick={clearImage}>
                      삭제
                    </button>
                  )}
                </div>
                {imageUrl && (
                  <img src={imageUrl} alt="업로드된 이미지 미리보기" className="image-preview" />
                )}
              </div>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="submit-button" disabled={submitting || uploading}>
            {submitting ? '등록 중...' : '상품 등록'}
          </button>
        </form>
      </main>
    </div>
  )
}
