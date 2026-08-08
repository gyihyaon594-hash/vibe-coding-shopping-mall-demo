export default function FacultySection({ faculty }) {
  return (
    <section className="faculty">
      <div className="section-inner">
        <p className="eyebrow">FACULTY</p>
        <h2>현장에서 데이터를 만드는 연구진이 직접 강의합니다</h2>
        <div className="faculty-grid">
          {faculty.map((person) => (
            <article key={person.name} className="faculty-card">
              <div className="faculty-top">
                <div className="avatar">{person.initial}</div>
                <div>
                  <h3>{person.name}</h3>
                  <p>{person.role}</p>
                </div>
              </div>
              <p className="faculty-bio">{person.bio}</p>
              <div className="faculty-stats">
                <div>
                  <span>개설 과정</span>
                  <strong>{person.courses}</strong>
                </div>
                <div>
                  <span>수강생</span>
                  <strong>{person.students}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
