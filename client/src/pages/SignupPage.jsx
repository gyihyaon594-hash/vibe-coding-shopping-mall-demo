import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './SignupPage.css'

const PASSWORD_RULE = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/

const icons = {
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  ),
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
}

function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const allAgreed = agree.terms && agree.privacy && agree.marketing

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function toggleAll(e) {
    const { checked } = e.target
    setAgree({ terms: checked, privacy: checked, marketing: checked })
  }

  function toggleOne(e) {
    const { name, checked } = e.target
    setAgree((prev) => ({ ...prev, [name]: checked }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      return setError('이름을 입력해주세요.')
    }
    if (!PASSWORD_RULE.test(form.password)) {
      return setError('비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.')
    }
    if (form.password !== form.passwordConfirm) {
      return setError('비밀번호가 일치하지 않습니다.')
    }
    if (!agree.terms || !agree.privacy) {
      return setError('필수 약관에 동의해주세요.')
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name.trim(),
          password: form.password,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || '회원가입에 실패했습니다.')
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/'), 1500)
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="signup-page">
        <div className="signup-container">
          <h1>회원가입 완료</h1>
          <p className="signup-subtitle">환영합니다! 메인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1>회원가입</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="name">이름</label>
            <div className="input-wrap">
              <span className="input-icon">{icons.user}</span>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

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
            <p className="field-hint">8자 이상, 영문, 숫자, 특수문자 포함</p>
          </div>

          <div className="field">
            <label htmlFor="passwordConfirm">비밀번호 확인</label>
            <div className="input-wrap">
              <span className="input-icon">{icons.lock}</span>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="비밀번호를 다시 입력하세요"
                value={form.passwordConfirm}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                {showConfirm ? icons.eyeOff : icons.eye}
              </button>
            </div>
          </div>

          <div className="agreements">
            <label className="agreement all">
              <input type="checkbox" checked={allAgreed} onChange={toggleAll} />
              전체 동의
            </label>
            <div className="agreement-list">
              <label className="agreement">
                <input type="checkbox" name="terms" checked={agree.terms} onChange={toggleOne} />
                이용약관 동의 <span className="required-tag">(필수)</span>
                <button type="button" className="view-button">보기</button>
              </label>
              <label className="agreement">
                <input type="checkbox" name="privacy" checked={agree.privacy} onChange={toggleOne} />
                개인정보처리방침 동의 <span className="required-tag">(필수)</span>
                <button type="button" className="view-button">보기</button>
              </label>
              <label className="agreement">
                <input type="checkbox" name="marketing" checked={agree.marketing} onChange={toggleOne} />
                마케팅 정보 수신 동의 <span className="optional">(선택)</span>
              </label>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="login-hint">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage
