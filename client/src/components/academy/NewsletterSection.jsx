import { useState } from 'react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')

  return (
    <section className="newsletter">
      <div className="newsletter-inner">
        <div>
          <h2>새 과정 소식을 가장 먼저 받아보세요</h2>
          <p>매월 알츠하이머 조기진단 논문 요약과 신규 강의 정보를 보내드립니다.</p>
        </div>
        <form
          className="newsletter-form"
          onSubmit={(e) => {
            e.preventDefault()
            setEmail('')
          }}
        >
          <input
            type="email"
            placeholder="name@hospital.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">구독 →</button>
        </form>
      </div>
    </section>
  )
}
