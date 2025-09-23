'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface LogoUploadProps {
  currentLogo: string;
  onLogoUpdate: (newLogoPath: string) => void;
}

export function LogoUpload({ currentLogo, onLogoUpdate }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم. يُسمح فقط بملفات JPEG, PNG, SVG, و WebP.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى هو 5 ميجابايت.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/admin/upload/logo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('تم رفع الشعار بنجاح! سيظهر في جميع أنحاء الموقع.');
        onLogoUpdate(result.logoPath);
        setPreviewUrl(null);
        
        // Show upload location info
        if (result.logoPath.includes('cloudinary')) {
          toast.info('تم الرفع إلى Cloudinary (التخزين السحابي)');
        } else {
          toast.info('تم الرفع إلى التخزين المحلي');
        }
      } else {
        toast.error(result.error || 'فشل في رفع الشعار');
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('حدث خطأ أثناء رفع الشعار');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">شعار الشركة</Label>
      
      {/* Current Logo Display */}
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          {currentLogo ? (
            <img 
              src={currentLogo} 
              alt="Current Logo" 
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">
            الشعار الحالي: {currentLogo || 'لم يتم تحديد شعار'}
          </p>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'جارٍ الرفع...' : 'رفع شعار جديد'}</span>
          </Button>
        </div>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="flex items-center space-x-4 rtl:space-x-reverse p-4 bg-blue-50 rounded-lg">
          <div className="w-16 h-16 border border-blue-200 rounded-lg overflow-hidden">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-700">معاينة الشعار الجديد</p>
            <p className="text-xs text-blue-600">جارٍ الرفع...</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPreview}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        الأنواع المدعومة: JPEG, PNG, SVG, WebP | الحد الأقصى: 5 ميجابايت
      </p>
    </div>
  );
}
