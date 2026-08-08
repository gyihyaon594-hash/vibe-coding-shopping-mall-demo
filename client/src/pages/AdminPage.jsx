import { Link, Navigate } from 'react-router-dom'
import Navbar from '../components/academy/Navbar'
import { useAuthUser } from '../hooks/useAuthUser'
import './AdminPage.css'
import './MainPage.css'

const STATS = [
  {
    label: '총 수강신청',
    value: '1,234',
    change: '+12% from last month',
    icon: 'orders',
    tone: 'blue',
  },
  {
    label: '총 강의',
    value: '42',
    change: '+3% from last month',
    icon: 'courses',
    tone: 'green',
  },
  {
    label: '총 수강생',
    value: '2,345',
    change: '+8% from last month',
    icon: 'users',
    tone: 'purple',
  },
  {
    label: '총 매출',
    value: '₩45,678,000',
    change: '+15% from last month',
    icon: 'sales',
    tone: 'orange',
  },
]

const QUICK_ACTIONS = [
  { label: '+ 새 강의 등록', primary: true, to: '/admin/products/new' },
  { label: '상품 관리', icon: 'eye', to: '/admin/products' },
  { label: '매출 분석', icon: 'chart' },
  { label: '수강생 관리', icon: 'users' },
]

const RECENT_ENROLLMENTS = [
  {
    id: 'ENR-001234',
    name: '김민수',
    date: '2026-08-06',
    status: 'processing',
    statusLabel: '처리중',
    amount: '289,000원',
  },
  {
    id: 'ENR-001233',
    name: '이서연',
    date: '2026-08-05',
    status: 'shipping',
    statusLabel: '수강중',
    amount: '329,000원',
  },
  {
    id: 'ENR-001232',
    name: '박지훈',
    date: '2026-08-05',
    status: 'done',
    statusLabel: '완료',
    amount: '149,000원',
  },
  {
    id: 'ENR-001231',
    name: '최유진',
    date: '2026-08-04',
    status: 'done',
    statusLabel: '완료',
    amount: '690,000원',
  },
]

function StatIcon({ type }) {
  if (type === 'courses') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7h16v12H4z" />
        <path d="M8 7V5h8v2" />
      </svg>
    )
  }
  if (type === 'users') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
        <path d="M15 19c0-2 1.5-3.5 4-3.5" />
      </svg>
    )
  }
  if (type === 'sales') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15l3-4 3 2 4-6" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H7" />
    </svg>
  )
}

function ActionIcon({ type }) {
  if (type === 'chart') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 19V9M12 19V5M19 19v-7" />
      </svg>
    )
  }
  if (type === 'users') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function AdminPage() {
  const { user, loading } = useAuthUser()

  if (loading) {
    return <div className="admin-loading">불러오는 중...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.user_type !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="admin-page">
      <Navbar />

      <main className="admin-main">
        <section className="admin-intro">
          <h1>관리자 대시보드</h1>
          <p>KHU_DEMENTIA ACADEMY 관리 시스템에 오신 것을 환영합니다.</p>
        </section>

        <section className="stat-grid">
          {STATS.map((stat) => (
            <article key={stat.label} className="stat-card">
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-change">{stat.change}</p>
              </div>
              <div className={`stat-icon ${stat.tone}`}>
                <StatIcon type={stat.icon} />
              </div>
            </article>
          ))}
        </section>

        <section className="admin-panels">
          <article className="panel">
            <h2>빠른 작업</h2>
            <div className="quick-actions">
              {QUICK_ACTIONS.map((action) =>
                action.to ? (
                  <Link
                    key={action.label}
                    to={action.to}
                    className={action.primary ? 'action-primary' : 'action-secondary'}
                  >
                    {!action.primary && action.icon && (
                      <span className="action-icon">
                        <ActionIcon type={action.icon} />
                      </span>
                    )}
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    className={action.primary ? 'action-primary' : 'action-secondary'}
                  >
                    {!action.primary && (
                      <span className="action-icon">
                        <ActionIcon type={action.icon} />
                      </span>
                    )}
                    {action.label}
                  </button>
                )
              )}
            </div>
          </article>

          <article className="panel recent-panel">
            <div className="panel-header">
              <h2>최근 수강신청</h2>
              <button type="button" className="view-all">
                전체보기
              </button>
            </div>
            <ul className="enrollment-list">
              {RECENT_ENROLLMENTS.map((item) => (
                <li key={item.id}>
                  <div className="enrollment-meta">
                    <strong>{item.id}</strong>
                    <span>
                      {item.name} · {item.date}
                    </span>
                  </div>
                  <div className="enrollment-right">
                    <span className={`status-badge ${item.status}`}>{item.statusLabel}</span>
                    <strong className="amount">{item.amount}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  )
}
