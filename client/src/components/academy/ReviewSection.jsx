export default function ReviewSection({ reviews }) {
  return (
    <section className="reviews">
      <div className="section-inner">
        <p className="eyebrow light">REVIEWS</p>
        <h2>수강 후기</h2>
        <div className="review-grid">
          {reviews.map((review) => (
            <article key={review.code} className="review-card">
              <div className="stars">★★★★★</div>
              <p>{review.text}</p>
              <div className="review-footer">
                <div>
                  <strong>{review.name}</strong>
                  <span>{review.role}</span>
                </div>
                <em>{review.code}</em>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
