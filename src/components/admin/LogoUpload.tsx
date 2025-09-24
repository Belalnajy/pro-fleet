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
        toast.success('تم رفع الشعار بنجاح!');
        onLogoUpdate(result.logoPath);
        setPreviewUrl(null);
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
    <div className="space-y-3">
      <Label className="text-sm font-medium">شعار الشركة</Label>
      
      {/* Current Logo Display - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 flex-shrink-0">
          {currentLogo ? (
            <img 
              src={currentLogo} 
              alt="شعار" 
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1 w-full">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 break-all">
            <span className="hidden sm:inline">الشعار الحالي: </span>
            <span className="sm:hidden">الشعار: </span>
            <span className="font-mono text-xs">
              {currentLogo ? (
                <span className="block sm:inline">
                  <span className="sm:hidden">{currentLogo.length > 30 ? '...' + currentLogo.slice(-30) : currentLogo}</span>
                  <span className="hidden sm:inline">{currentLogo.length > 50 ? '...' + currentLogo.slice(-50) : currentLogo}</span>
                </span>
              ) : (
                'غير محدد'
              )}
            </span>
          </p>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="sm:hidden">{isUploading ? 'رفع...' : 'رفع'}</span>
            <span className="hidden sm:inline">{isUploading ? 'جارٍ الرفع...' : 'رفع شعار جديد'}</span>
          </Button>
        </div>
      </div>

      {/* Preview - Responsive */}
      {previewUrl && (
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border border-blue-200 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={previewUrl} 
              alt="معاينة" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-blue-700 font-medium">
              <span className="sm:hidden">معاينة</span>
              <span className="hidden sm:inline">معاينة الشعار الجديد</span>
            </p>
            <p className="text-xs text-blue-600">
              <span className="sm:hidden">رفع...</span>
              <span className="hidden sm:inline">جارٍ الرفع...</span>
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPreview}
            disabled={isUploading}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
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

      {/* Help Text - Responsive */}
      <p className="text-xs text-gray-500 leading-relaxed">
        <span className="sm:hidden">JPEG, PNG, SVG, WebP | حد أقصى: 5MB</span>
        <span className="hidden sm:inline">الأنواع المدعومة: JPEG, PNG, SVG, WebP | الحد الأقصى: 5 ميجابايت</span>
      </p>
    </div>
  );
}
