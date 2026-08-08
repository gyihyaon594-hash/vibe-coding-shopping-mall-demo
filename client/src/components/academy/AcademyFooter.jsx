export default function AcademyFooter() {
  return (
    <footer className="academy-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>KHU_DEMENTIA</strong>
          <p>
            딥러닝과 ATN 바이오마커를 바탕으로 치매 예측·예방 교육을 제공하는
            헬스케어 아카데미입니다.
          </p>
        </div>
        <div>
          <h4>강의</h4>
          <button type="button">전체 과정</button>
          <button type="button">연구자 패스</button>
          <button type="button">기관 라이선스</button>
          <button type="button">무료 공개 강의</button>
        </div>
        <div>
          <h4>고객지원</h4>
          <button type="button">자주 묻는 질문</button>
          <button type="button">수강 · 환불 정책</button>
          <button type="button">증명서 발급</button>
          <button type="button">1:1 문의</button>
        </div>
        <div>
          <h4>회사</h4>
          <button type="button">뷰브레인헬스케어 소개</button>
          <button type="button">연구 성과</button>
          <button type="button">채용</button>
          <button type="button">보도자료</button>
        </div>
      </div>
      <p className="copyright">
        © {new Date().getFullYear()} KHU_DEMENTIA Academy. All rights reserved.
      </p>
    </footer>
  )
}
