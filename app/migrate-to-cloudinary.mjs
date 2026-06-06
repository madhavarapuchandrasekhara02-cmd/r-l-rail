/**
 * Roots & Leaves: Supabase to Cloudinary Media Migrator
 * 
 * Automatically downloads legacy product images from Supabase Storage,
 * uploads them directly to Cloudinary (preserving category folder hierarchy),
 * and updates the Supabase PostgreSQL database records securely.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Service key to bypass RLS and allow product updates

function getCloudinaryFolder(category) {
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

async function runMigration() {
  console.log('✨ Initializing Roots & Leaves Media Migration...');

  // 1. Validation checks
  if (!cloudName || cloudName === 'your-cloudinary-cloud-name') {
    console.error('❌ Error: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured in .env');
    process.exit(1);
  }
  if (!uploadPreset || uploadPreset === 'your-unsigned-upload-preset') {
    console.error('❌ Error: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not configured in .env');
    process.exit(1);
  }
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase credentials are not configured in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. Fetch all products
  console.log('📡 Fetching products from Supabase database...');
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('❌ Failed to fetch products:', error);
    process.exit(1);
  }

  console.log(`📦 Found ${products.length} products to analyze.`);

  let totalMigratedImages = 0;
  let totalMigratedProducts = 0;

  for (const product of products) {
    const images = product.images || [];
    if (images.length === 0) continue;

    console.log(`\n🔍 Checking product: "${product.name}" (ID: ${product.id}, Category: ${product.category})`);

    let hasChanges = false;
    const updatedImages = [];

    for (let idx = 0; idx < images.length; idx++) {
      const imageUrl = images[idx];

      // We only migrate legacy Supabase Storage or external images (exclude already migrated res.cloudinary.com URLs)
      if (imageUrl.includes('supabase.co/storage') || imageUrl.includes('/storage/v1/object/public/')) {
        console.log(`  ➡️ Legacy image found: ${imageUrl}`);
        console.log(`  ⏳ Downloading and transferring to Cloudinary...`);

        try {
          // Download asset
          const res = await fetch(imageUrl);
          if (!res.ok) throw new Error(`Download failed with status ${res.status}`);

          const contentType = res.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await res.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const dataUri = `data:${contentType};base64,${base64}`;

          const filename = imageUrl.split('/').pop()?.split('?')[0] || `img_${idx}`;
          const cleanPublicId = filename.substring(0, filename.lastIndexOf('.')) || filename;
          const sanitizedPublicId = cleanPublicId.replace(/[^a-zA-Z0-9_-]/g, '_');

          const folder = getCloudinaryFolder(product.category);

          // Upload to Cloudinary REST endpoint
          const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
          const uploadRes = await fetch(cloudinaryEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: dataUri,
              upload_preset: uploadPreset,
              folder: folder,
              public_id: sanitizedPublicId,
              filename_override: sanitizedPublicId
            })
          });

          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            throw new Error(`Cloudinary upload failed: ${errText}`);
          }

          const uploadData = await uploadRes.json();
          const cloudinaryUrl = uploadData.secure_url;

          console.log(`  ✅ Successfully migrated to Cloudinary: ${cloudinaryUrl}`);
          updatedImages.push(cloudinaryUrl);
          hasChanges = true;
          totalMigratedImages++;
        } catch (uploadErr) {
          console.error(`  ❌ Failed to migrate image [${idx}]:`, uploadErr.message);
          // Keep original image if migration fails so we don't lose the asset
          updatedImages.push(imageUrl);
        }
      } else {
        // Keep already optimized Cloudinary url or other branding urls unchanged
        updatedImages.push(imageUrl);
      }
    }

    if (hasChanges) {
      console.log(`  💾 Saving updated product image URLs back to Supabase database...`);
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: updatedImages })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ❌ Failed to update product in DB:`, updateError.message);
      } else {
        console.log(`  🎉 Product "${product.name}" successfully updated in database!`);
        totalMigratedProducts++;
      }
    } else {
      console.log(`  ✨ Product "${product.name}" is already fully optimized.`);
    }
  }

  console.log(`\n🏁 Migration completed!`);
  console.log(`📊 Migrated ${totalMigratedImages} images across ${totalMigratedProducts} products.`);
}

runMigration().catch(err => {
  console.error('❌ Fatal error during migration process:', err);
});
