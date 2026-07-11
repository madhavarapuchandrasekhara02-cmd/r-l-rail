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
  // If the source image is not hosted on Cloudinary, pass it through directly
  if (!src.includes('res.cloudinary.com')) {
    return src
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

  // Configure transformations: resize to target width, compress quality, and auto-format (avif/webp/png)
  const params = [
    `w_${width}`,
    `c_limit`,
    `q_${quality || 'auto'}`,
    'f_auto'
  ].join(',')

  // Prevent double-applying transformations if they are already present in the suffix
  if (suffix.match(/w_\d+/)) {
    return cleanSrc
  }

  return `${prefix}${params}/${suffix}`
}
