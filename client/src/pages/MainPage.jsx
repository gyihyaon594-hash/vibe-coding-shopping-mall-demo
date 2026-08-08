import { useEffect, useState } from 'react'
import { FACULTY, FEATURES, PLANS, REVIEWS } from '../data/academyData'
import AcademyFooter from '../components/academy/AcademyFooter'
import AcademyHero from '../components/academy/AcademyHero'
import CourseSection from '../components/academy/CourseSection'
import FacultySection from '../components/academy/FacultySection'
import FeatureSection from '../components/academy/FeatureSection'
import Navbar from '../components/academy/Navbar'
import NewsletterSection from '../components/academy/NewsletterSection'
import PlanSection from '../components/academy/PlanSection'
import ReviewSection from '../components/academy/ReviewSection'
import './MainPage.css'

export default function MainPage() {
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setProductsLoading(true)
      setProductsError('')
      try {
        const res = await fetch('/api/products?all=true')
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) {
            setProductsError(data.message || '상품을 불러오지 못했습니다.')
            setProducts([])
          }
          return
        }
        if (!cancelled) {
          setProducts(Array.isArray(data.products) ? data.products : [])
        }
      } catch {
        if (!cancelled) {
          setProductsError('서버에 연결할 수 없습니다.')
          setProducts([])
        }
      } finally {
        if (!cancelled) setProductsLoading(false)
      }
    }

    loadProducts()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="academy">
      <Navbar />
      <AcademyHero />
      <FeatureSection features={FEATURES} />
      <CourseSection
        products={products}
        loading={productsLoading}
        error={productsError}
      />
      <FacultySection faculty={FACULTY} />
      <PlanSection plans={PLANS} />
      <ReviewSection reviews={REVIEWS} />
      <NewsletterSection />
      <AcademyFooter />
    </div>
  )
}
