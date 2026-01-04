const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * @param {File} file - Зображення
 * @param {'client'|'master'} type - Тип користувача (для папки)
 * @returns {Promise<{url: string, public_id: string}>}
 */
export async function uploadImageToCloudinary(file, type = 'general') {
  if (!CLOUDINARY_URL || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary env variables are missing')
  }

  const folder = getFolderPath(type)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', folder)

  try {
    const res = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (!res.ok || !data.secure_url) {
      const msg = data.error?.message || 'Cloudinary upload failed'
      console.error('Cloudinary error:', msg)
      throw new Error(msg)
    }

    return {
      url: data.secure_url,
      public_id: data.public_id,
    }
  } catch (err) {
    console.error('❌ Failed to upload image to Cloudinary:', err.message)
    throw err
  }
}

/**
 * Повертає шлях до папки у Cloudinary залежно від типу
 * @param {'client'|'master'|'general'} type
 * @returns {string}
 */
function getFolderPath(type) {
  switch (type) {
    case 'client':
      return 'salon/clients'
    case 'master':
      return 'salon/masters'
    default:
      return 'salon/general'
  }
}
