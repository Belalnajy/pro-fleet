# إعداد Cloudinary لرفع الشعارات

## الخطوات المطلوبة:

### 1. إنشاء حساب Cloudinary (مجاني)
1. اذهب إلى: https://cloudinary.com/
2. اضغط "Sign Up" وأنشئ حساب مجاني
3. بعد التسجيل، ستحصل على Dashboard

### 2. الحصول على بيانات الاعتماد
من Dashboard في Cloudinary، ستجد:
- **Cloud Name**: اسم السحابة الخاص بك
- **API Key**: مفتاح API
- **API Secret**: المفتاح السري

### 3. إضافة المتغيرات إلى ملف .env
يمكنك استخدام إحدى الطريقتين:

#### الطريقة الأولى: متغيرات منفصلة
أضف هذه السطور إلى ملف `.env.local` أو `.env`:
```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

#### الطريقة الثانية: URL واحد (أسهل)
أو استخدم URL واحد فقط:
```bash
# Cloudinary URL (من Dashboard)
CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@<your_cloud_name>
```

**مثال**: `CLOUDINARY_URL=cloudinary://123456789:abcdef123456@dsoqjifum`

### 4. إعادة تشغيل الخادم
بعد إضافة المتغيرات، أعد تشغيل الخادم:
```bash
npm run dev
```

## المزايا:
- ✅ **رفع سحابي**: الشعارات تُحفظ في السحابة وليس على الخادم المحلي
- ✅ **تحسين تلقائي**: Cloudinary يحسن الصور تلقائياً
- ✅ **CDN سريع**: توصيل سريع من جميع أنحاء العالم
- ✅ **مساحة مجانية**: 25 جيجا مجاناً شهرياً
- ✅ **نسخ احتياطية**: الصور محفوظة بأمان

## البديل المحلي:
إذا لم تضع بيانات Cloudinary، سيتم حفظ الشعارات محلياً في مجلد `/public/uploads/`

## اختبار النظام:
1. اذهب إلى `/admin/settings`
2. في قسم "شعار الشركة"، اضغط "رفع شعار جديد"
3. اختر صورة واتركها ترفع
4. ستظهر في جميع أنحاء الموقع فوراً

## استكشاف الأخطاء:
- تأكد من صحة بيانات Cloudinary
- تأكد من أن الملف أقل من 5 ميجابايت
- الأنواع المدعومة: JPEG, PNG, SVG, WebP
