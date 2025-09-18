# دليل نظام إعادة تعيين كلمة المرور

## نظرة عامة
تم تنفيذ نظام شامل لإعادة تعيين كلمة المرور يتضمن:
- إرسال رابط إعادة التعيين عبر البريد الإلكتروني
- التحقق من صحة الرموز المؤقتة
- تغيير كلمة المرور بأمان
- حماية من هجمات تعداد البريد الإلكتروني

## المكونات المضافة

### 1. قاعدة البيانات
- جدول `password_reset_tokens` لحفظ الرموز المؤقتة
- صلاحية 15 دقيقة لكل رمز
- منع إعادة استخدام الرموز

### 2. APIs
- `POST /api/auth/forgot-password` - طلب إعادة تعيين
- `GET /api/auth/verify-reset-token` - التحقق من الرمز
- `POST /api/auth/reset-password` - تغيير كلمة المرور

### 3. صفحات الواجهة
- `/auth/forgot-password` - نموذج طلب إعادة التعيين
- `/auth/reset-password` - نموذج تغيير كلمة المرور
- رابط "نسيت كلمة المرور؟" في صفحة تسجيل الدخول

## كيفية الاستخدام

### للمستخدمين
1. في صفحة تسجيل الدخول، اضغط "نسيت كلمة المرور؟"
2. أدخل بريدك الإلكتروني واضغط "إرسال"
3. تحقق من بريدك الإلكتروني وافتح الرابط
4. أدخل كلمة المرور الجديدة وأكدها
5. سيتم توجيهك لصفحة تسجيل الدخول

### للمطورين
```typescript
// استخدام مكتبة إعادة التعيين
import { createPasswordResetToken, resetPassword } from '@/lib/password-reset'

// إنشاء رمز جديد
const result = await createPasswordResetToken('user@example.com')

// تغيير كلمة المرور
const resetResult = await resetPassword(token, newPassword)
```

## إعدادات البريد الإلكتروني

### Gmail (للتطوير)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youraddress@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="اسم التطبيق <youraddress@gmail.com>"
```

### Mailtrap (للاختبار)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=mailtrap_username
SMTP_PASS=mailtrap_password
SMTP_FROM="Test App <test@example.com>"
```

### SendGrid (للإنتاج)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM="Your App <no-reply@yourdomain.com>"
```

## الأمان

### الحماية المطبقة
- ✅ رموز عشوائية آمنة (32 بايت)
- ✅ صلاحية محدودة (15 دقيقة)
- ✅ منع إعادة الاستخدام
- ✅ تشفير كلمات المرور (bcrypt)
- ✅ منع تعداد البريد الإلكتروني
- ✅ تنظيف الرموز المنتهية

### نصائح إضافية
- استخدم HTTPS في الإنتاج
- فعّل Rate Limiting على endpoints
- راقب محاولات إعادة التعيين المشبوهة
- استخدم مزود بريد موثوق

## استكشاف الأخطاء

### الإيميلات لا تصل
1. تحقق من إعدادات SMTP في `.env`
2. تأكد من صحة SMTP_USER و SMTP_PASS
3. راجع logs الخادم للأخطاء
4. جرب Mailtrap للاختبار

### أخطاء الرموز
- تأكد من تشغيل `npx prisma generate` بعد تحديث Schema
- تحقق من صلاحية الرمز (15 دقيقة)
- تأكد من عدم استخدام الرمز سابقاً

### أخطاء قاعدة البيانات
```bash
# إعادة توليد Prisma Client
npx prisma generate

# تطبيق التغييرات
npx prisma db push
```

## الصيانة

### تنظيف الرموز المنتهية
```typescript
import { cleanupExpiredTokens } from '@/lib/password-reset'

// تشغيل دوري (مثلاً كل ساعة)
await cleanupExpiredTokens()
```

### مراقبة الاستخدام
- راقب عدد طلبات إعادة التعيين
- تتبع معدلات نجاح/فشل الإرسال
- راجع logs الأمان بانتظام

## الدعم
لأي استفسارات أو مشاكل، راجع:
- ملفات المكتبة في `src/lib/`
- APIs في `src/app/api/auth/`
- صفحات الواجهة في `src/app/auth/`
