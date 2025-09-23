import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateSystemSetting } from '@/lib/system-settings';
import { uploadLogo } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('logo') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, SVG, and WebP files are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload logo using the upload service
    const logoPath = await uploadLogo(buffer, file.name);

    // Update system settings with new logo path
    await updateSystemSetting('business.companyLogo', logoPath);

    return NextResponse.json({ 
      success: true, 
      logoPath,
      message: 'Logo uploaded successfully' 
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ 
      error: 'Failed to upload logo' 
    }, { status: 500 });
  }
}
