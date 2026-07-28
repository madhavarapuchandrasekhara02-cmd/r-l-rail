// Custom loader for Cloudinary images in Next.js
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  // If the source image is not hosted on Cloudinary, pass it through directly with a width parameter to satisfy Next.js
  if (!src.includes('res.cloudinary.com')) {
    return src.includes('?') ? `${src}&w=${width}` : `${src}?w=${width}`
  }

  // Normalize duplicate slashes or protocols if any
  const cleanSrc = src.trim()

  // Cloudinary allows inserting transformations right after "/upload/"
  // Format: https://res.cloudinary.com/[cloud_name]/image/upload/[transformations]/[public_id]
  const uploadMarker = '/image/upload/'
  const uploadIndex = cleanSrc.indexOf(uploadMarker)

  if (uploadIndex === -1) {
    return cleanSrc
  }

  const prefix = cleanSrc.substring(0, uploadIndex + uploadMarker.length)
  const suffix = cleanSrc.substring(uploadIndex + uploadMarker.length)

  // Enforce a minimum width of 800px to ensure pixel-perfect label readability on 2x/3x Retina screens
  const targetWidth = width < 800 ? 800 : width

  const params = [
    `w_${targetWidth}`,
    `c_limit`,
    `q_100`, // Force lossless quality to prevent text artifacts and keep fine label print crisp
    'e_sharpen:90', // Sharpen AI vector boundaries
    'f_auto'
  ].join(',')

  // Prevent double-applying transformations if they are already present in the suffix
  if (suffix.match(/w_\d+/)) {
    return cleanSrc
  }

  return `${prefix}${params}/${suffix}`
}
