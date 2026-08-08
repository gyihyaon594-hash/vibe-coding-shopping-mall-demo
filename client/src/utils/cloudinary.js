const SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js'

let loadingPromise = null

export function loadCloudinary() {
  if (window.cloudinary) {
    return Promise.resolve(window.cloudinary)
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (window.cloudinary) {
        resolve(window.cloudinary)
      } else {
        reject(new Error('Cloudinary 위젯을 불러오지 못했습니다.'))
      }
    }
    script.onerror = () => reject(new Error('Cloudinary 스크립트 로드에 실패했습니다.'))
    document.body.appendChild(script)
  })

  return loadingPromise
}

export function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    return null
  }

  return { cloudName, uploadPreset }
}
