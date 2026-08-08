export default function AcademyHero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="hero-badge">
            <span className="dot" />
            KHU_DEMENTIA ACADEMY
          </span>
          <h1>
            치매는 치료가 아니라
            <br />
            예측과 예방에서 시작합니다
          </h1>
          <p className="hero-desc">
            딥러닝 · ATN 바이오마커 · 인지중재까지. 연구와 임상 현장에서 바로 쓰는
            치매 예측·예방 강의를 한곳에서 수강하세요.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary">
              전체 강의 둘러보기 →
            </button>
            <button type="button" className="btn-secondary">
              ▶ 1강 무료 체험
            </button>
          </div>
          <div className="hero-stats">
            <div>
              <strong>42</strong>
              <span>개 과정</span>
              <small>연구자 · 임상 · 보호자</small>
            </div>
            <div>
              <strong>13,600</strong>
              <span>명</span>
              <small>누적 수강생</small>
            </div>
            <div>
              <strong>4.87</strong>
              <span>/ 5.0</span>
              <small>평균 강의 만족도</small>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="brain-panel">
            <div className="brain-glow" />
            <svg className="brain-svg" viewBox="0 0 280 280" fill="none">
              <ellipse cx="140" cy="145" rx="95" ry="110" fill="url(#brainGrad)" opacity="0.95" />
              <path
                d="M90 120c20-35 50-45 80-40 25 4 45 22 50 48 4 20-2 40-18 55-12 11-18 22-16 38"
                stroke="#5eead4"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M110 90c18 8 28 24 30 42M150 85c12 18 18 36 14 58M100 160c22 10 40 12 62 6"
                stroke="#99f6e4"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
              <circle cx="130" cy="130" r="4" fill="#ccfbf1" />
              <circle cx="165" cy="150" r="3.5" fill="#5eead4" />
              <circle cx="145" cy="175" r="3" fill="#99f6e4" />
              <defs>
                <linearGradient id="brainGrad" x1="60" y1="40" x2="220" y2="240">
                  <stop stopColor="#1e3a5f" />
                  <stop offset="1" stopColor="#0f766e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="marker-card">
              <span>ATN</span>
              <span>A+ T− N−</span>
              <span>Aβ</span>
              <span>Tau</span>
              <span>Neuro</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
