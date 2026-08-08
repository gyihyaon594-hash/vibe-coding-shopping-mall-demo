// 포트원 V2 REST API 유틸
const API_BASE = 'https://api.portone.io';

// 결제 단건 조회 — GET /payments/{paymentId}
// https://developers.portone.io/api/rest-v2/payment
async function getPayment(paymentId) {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) {
    throw new Error('PORTONE_API_SECRET 환경변수가 설정되지 않았습니다.');
  }

  const res = await fetch(
    `${API_BASE}/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: `PortOne ${secret}` },
    }
  );

  if (res.status === 404) {
    return null; // 존재하지 않는 결제
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`포트원 결제 조회 실패 (${res.status}): ${body}`);
  }

  return res.json();
}

module.exports = { getPayment };
