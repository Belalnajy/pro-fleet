import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
// Support both individual env vars and CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
  // Cloudinary will auto-configure from CLOUDINARY_URL
  cloudinary.config();
} else {
  // Manual configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = 'profleet'
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folder,
        public_id: filename,
        overwrite: true,
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    ).end(buffer);
  });
}

// Fallback: Upload to local storage for development
export async function uploadToLocal(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const { existsSync } = await import('fs');

  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);
    
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error uploading to local storage:', error);
    throw error;
  }
}

// Main upload function that tries cloud first, then falls back to local
export async function uploadLogo(
  buffer: Buffer,
  originalFilename: string
): Promise<string> {
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop();
  const filename = `logo-${timestamp}`;
  const filenameWithExt = `${filename}.${extension}`;

  // Try Cloudinary first if configured (either via URL or individual vars)
  if (
    process.env.CLOUDINARY_URL || 
    (process.env.CLOUDINARY_CLOUD_NAME && 
     process.env.CLOUDINARY_API_KEY && 
     process.env.CLOUDINARY_API_SECRET)
  ) {
    try {
      const cloudUrl = await uploadToCloudinary(buffer, filename, 'profleet/logos');
      console.log('✅ Logo uploaded to Cloudinary:', cloudUrl);
      return cloudUrl;
    } catch (error) {
      console.error('❌ Cloudinary upload failed, falling back to local:', error);
    }
  }

  // Fallback to local storage
  try {
    const localUrl = await uploadToLocal(buffer, filenameWithExt);
    console.log('✅ Logo uploaded to local storage:', localUrl);
    return localUrl;
  } catch (error) {
    console.error('❌ Local upload failed:', error);
    throw new Error('Failed to upload logo to any storage provider');
  }
}
