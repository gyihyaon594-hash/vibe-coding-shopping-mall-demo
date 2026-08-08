export default function PlanSection({ plans }) {
  return (
    <section className="plans">
      <div className="section-inner">
        <p className="eyebrow">PASS</p>
        <h2>한 과정만, 또는 전 과정 한꺼번에</h2>
        <div className="plan-grid">
          {plans.map((plan) => (
            <article key={plan.id} className={`plan-card ${plan.highlight ? 'highlight' : ''}`}>
              {plan.badge && <span className="plan-badge">{plan.badge}</span>}
              <h3>{plan.title}</h3>
              <p className="plan-price">{plan.price}</p>
              <p className="plan-subtitle">{plan.subtitle}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>
              <button type="button" className={plan.highlight ? 'btn-light' : 'btn-outline'}>
                {plan.cta} →
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
