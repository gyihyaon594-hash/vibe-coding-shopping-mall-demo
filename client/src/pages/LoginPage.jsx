import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/academy/Navbar'
import { clearStoredAuth, getStoredToken } from '../utils/authStorage'
import './MainPage.css'
import './LoginPage.css'

const icons = {
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1-.8 2.6-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.7-5H1.4v3C3.4 21.4 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4v-3H1.4C.5 8.4 0 10.1 0 12s.5 3.6 1.4 5.4l3.9-3z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.6 1.4l3.3-3.2C16.9 1 14.2 0 12 0 7.4 0 3.4 2.6 1.4 6.6l3.9 3c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.98-.2 1.92-.86 3.08-.78 1.4.11 2.44.66 3.14 1.66-2.88 1.73-2.42 5.52.34 6.87-.53 1.4-1.22 2.79-2.64 4.42zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  ),
}

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // 이미 유효한 토큰이 있으면 로그인 페이지 대신 메인으로 이동
  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      setCheckingAuth(false)
      return
    }

    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          navigate('/', { replace: true })
          return
        }
        clearStoredAuth()
        setCheckingAuth(false)
      })
      .catch(() => {
        setCheckingAuth(false)
      })
  }, [navigate])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function notReady() {
    setError('아직 지원하지 않는 기능입니다.')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.password) {
      return setError('이메일과 비밀번호를 입력해주세요.')
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '로그인에 실패했습니다.')
        return
      }

      // 로그인 상태 유지 체크 시 브라우저를 닫아도 유지되는 localStorage 사용
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('token', data.token)
      storage.setItem('user', JSON.stringify(data.user))

      navigate('/')
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="login-layout">
        <Navbar />
      </div>
    )
  }

  return (
    <div className="login-layout">
      <Navbar />
      <div className="login-page">
        <div className="login-container">
          <h1>로그인</h1>
          <p className="login-subtitle">계정에 로그인하여 쇼핑을 시작하세요</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <div className="input-wrap">
              <span className="input-icon">{icons.mail}</span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <div className="input-wrap">
              <span className="input-icon">{icons.lock}</span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showPassword ? icons.eyeOff : icons.eye}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              로그인 상태 유지
            </label>
            <button type="button" className="text-button" onClick={notReady}>
              비밀번호 찾기
            </button>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="divider">
          <span>또는</span>
        </div>

        <div className="social-buttons">
          <button type="button" className="social-button" onClick={notReady}>
            <span className="social-icon">{icons.google}</span>
            Google로 로그인
          </button>
          <button type="button" className="social-button" onClick={notReady}>
            <span className="social-icon">{icons.facebook}</span>
            Facebook으로 로그인
          </button>
          <button type="button" className="social-button apple" onClick={notReady}>
            <span className="social-icon">{icons.apple}</span>
            Apple로 로그인
          </button>
        </div>

        <p className="signup-hint">
          아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>

        <p className="terms-note">
          로그인하시면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다
        </p>
      </div>
      </div>
    </div>
  )
}

export default LoginPage
