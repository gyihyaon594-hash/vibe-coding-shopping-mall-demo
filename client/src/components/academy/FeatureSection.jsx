function FeatureIcon({ type }) {
  if (type === 'chat') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 16.5V7.8A2.8 2.8 0 0 1 7.8 5h8.4A2.8 2.8 0 0 1 19 7.8v5.4a2.8 2.8 0 0 1-2.8 2.8H9l-4 3.5z" />
      </svg>
    )
  }
  if (type === 'refresh') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 12a8 8 0 0 1 13.5-5.8L20 8" />
        <path d="M20 4v4h-4" />
        <path d="M20 12a8 8 0 0 1-13.5 5.8L4 16" />
        <path d="M4 20v-4h4" />
      </svg>
    )
  }
  if (type === 'certificate') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3c-3.5 2-6 5.2-6 9a6 6 0 0 0 12 0c0-3.8-2.5-7-6-9z" />
      <path d="M9.5 13.5c1 .8 1.8 1.2 2.5 1.2s1.5-.4 2.5-1.2" />
    </svg>
  )
}

export default function FeatureSection({ features }) {
  return (
    <section className="features">
      <div className="features-inner">
        {features.map((feature) => (
          <article key={feature.title} className="feature-item">
            <div className="feature-icon">
              <FeatureIcon type={feature.icon} />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
