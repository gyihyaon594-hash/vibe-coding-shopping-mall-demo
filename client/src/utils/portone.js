const SCRIPT_URL = 'https://cdn.portone.io/v2/browser-sdk.js'

// 포트원 V2 연동 정보 (관리자콘솔 > 결제 연동 에서 확인)
export const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID
export const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY

let loadingPromise = null

// V2 SDK 로드 후 window.PortOne 객체를 반환 (V2는 별도 init 불필요)
export function loadPortone() {
  if (window.PortOne) {
    return Promise.resolve(window.PortOne)
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (window.PortOne) {
        resolve(window.PortOne)
      } else {
        reject(new Error('포트원 결제 모듈을 불러오지 못했습니다.'))
      }
    }
    script.onerror = () => reject(new Error('포트원 스크립트 로드에 실패했습니다.'))
    document.body.appendChild(script)
  })

  return loadingPromise
}

export function getPortoneConfig() {
  if (!STORE_ID || !CHANNEL_KEY) {
    throw new Error(
      '포트원 설정이 없습니다. client/.env에 VITE_PORTONE_STORE_ID와 VITE_PORTONE_CHANNEL_KEY를 추가하세요.'
    )
  }
  return { storeId: STORE_ID, channelKey: CHANNEL_KEY }
}
