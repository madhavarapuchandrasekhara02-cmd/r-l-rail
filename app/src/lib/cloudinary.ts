/**
 * Cloudinary Media Asset Optimization Utility
 * 
 * Provides automated transformations for dynamic e-commerce media,
 * reducing Supabase storage usage & optimizing LCP/Lighthouse performance.
 */

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: string | number;
  format?: string;
  crop?: string;
}

/**
 * Parses and injects responsive sizing and format optimization parameters into Cloudinary URLs.
 * Falls back to returning the original URL unchanged if it is not a Cloudinary asset.
 */
export function getOptimizedImage(url: string, options: CloudinaryOptions = {}): string {
  if (!url) return '';
  
  // If the URL is not a Cloudinary asset (e.g., local /public, Supabase legacy, external placeholder),
  // return it untouched to ensure absolute backwards-compatibility.
  if (!url.includes('res.cloudinary.com')) {
    return url;
  }

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) {
      return url;
    }

    const base = url.substring(0, uploadIndex + 8); // e.g. "https://res.cloudinary.com/cloudname/image/upload/"
    const rest = url.substring(uploadIndex + 8);    // e.g. "v12345678/folder/image.jpg"

    const transformations: string[] = ['f_auto', 'q_auto'];

    if (options.width) {
      transformations.push(`w_${options.width}`);
    }
    if (options.height) {
      transformations.push(`h_${options.height}`);
    }
    if (options.crop) {
      transformations.push(`c_${options.crop}`);
    }
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    if (options.format) {
      transformations.push(`f_${options.format}`);
    }

    const transformSegment = transformations.join(',');

    // If the rest of the URL already starts with some transformations (like a folder starting with f_ or w_),
    // we safely prepend our standard optimize filters. Cloudinary chains these perfectly.
    return `${base}${transformSegment}/${rest}`;
  } catch (error) {
    console.error('Error optimizing Cloudinary URL:', error);
    return url;
  }
}

/**
 * Transforms product images to optimal card display size (e.g. 600px width for high-density Retina mobile/tablet screens).
 */
export function getProductImage(url: string): string {
  return getOptimizedImage(url, { width: 600 });
}

/**
 * Transforms images for fast cart/checkout mini thumbnails (e.g. 200px width).
 */
export function getThumbnailImage(url: string): string {
  return getOptimizedImage(url, { width: 200, height: 200, crop: 'fill' });
}

/**
 * Transforms images for high-definition storefront product galleries (e.g. 1200px width).
 */
export function getGalleryImage(url: string): string {
  return getOptimizedImage(url, { width: 1200 });
}

/**
 * Helper to map standard product category strings to organized Cloudinary folders.
 */
export function getCloudinaryFolder(category: string): string {
  const cleanCategory = (category || '').toLowerCase().trim();
  
  switch (cleanCategory) {
    case 'hair-rituals':
    case 'hair':
    case 'naturals':
      return 'roots-and-leaves/hair-rituals';
    case 'face-rituals':
    case 'face':
      return 'roots-and-leaves/face-rituals';
    case 'wellness-rituals':
    case 'wellness':
    case 'foods':
      return 'roots-and-leaves/wellness-rituals';
    case 'baby-rituals':
    case 'baby':
      return 'roots-and-leaves/baby-rituals';
    default:
      return 'roots-and-leaves/uncategorized-rituals';
  }
}
