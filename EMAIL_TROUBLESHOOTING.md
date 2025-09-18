# 📧 دليل حل مشاكل إرسال الإيميل

## 🔧 الخطوات لحل مشاكل إرسال الإيميل:

### 1. **تحقق من إعدادات `.env`:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=belalnajy9@gmail.com
SMTP_PASS=qrlr optb jkqv lcpo
SMTP_FROM="PRO FLEET <no-reply@profleet.com>"
```

### 2. **اختبر الإيميل بدون إرسال فعلي:**
```bash
# استخدم API الاختبار
POST /api/admin/invoices/[id]/test-email
```

### 3. **تحقق من Console Logs:**
افتح Developer Tools في المتصفح وتحقق من:
- Network tab لرؤية استجابة API
- Console tab لرؤية رسائل الخطأ

### 4. **أخطاء شائعة وحلولها:**

#### ❌ **EAUTH - خطأ في المصادقة:**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**الحل:**
- تأكد من تفعيل "2-Step Verification" في Gmail
- استخدم "App Password" بدلاً من كلمة المرور العادية
- اذهب إلى: Google Account > Security > App passwords

#### ❌ **ECONNECTION - خطأ في الاتصال:**
```
Error: connect ECONNREFUSED
```
**الحل:**
- تحقق من اتصال الإنترنت
- تأكد من أن SMTP_HOST و SMTP_PORT صحيحان
- جرب استخدام port 465 مع secure: true

#### ❌ **Customer email not found:**
**الحل:**
- تأكد من أن العميل لديه إيميل في قاعدة البيانات
- تحقق من جدول Users أن العميل له إيميل صحيح

### 5. **بدائل للاختبار:**

#### أ) **استخدم Mailtrap (مجاني للاختبار):**
```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

#### ب) **استخدم SendGrid (له خطة مجانية):**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### 6. **اختبار سريع:**

#### تشغيل API الاختبار:
```javascript
// في المتصفح Console:
fetch('/api/admin/invoices/INVOICE_ID/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log)
```

### 7. **فحص قاعدة البيانات:**
```sql
-- تحقق من وجود إيميلات للعملاء
SELECT u.email, u.name, i.invoiceNumber 
FROM invoices i 
JOIN trips t ON i.tripId = t.id 
JOIN users u ON t.customerId = u.id 
WHERE u.email IS NOT NULL;
```

### 8. **رسائل الخطأ المحسنة:**
الآن API الإيميل يعطي رسائل خطأ مفصلة:
- ✅ تحقق من إعدادات SMTP
- ✅ اختبار الاتصال قبل الإرسال  
- ✅ رسائل خطأ واضحة باللغة العربية
- ✅ تسجيل مفصل في Console

### 9. **للطوارئ - تعطيل إرسال الإيميل:**
إذا كنت تريد تعطيل إرسال الإيميل مؤقتاً:
```bash
# أضف هذا في .env
DISABLE_EMAIL_SENDING=true
```

### 10. **اختبار Gmail App Password:**
1. اذهب إلى Google Account Settings
2. Security > 2-Step Verification (يجب تفعيله)
3. App passwords > Generate new app password
4. استخدم كلمة المرور المولدة في SMTP_PASS

---

## 🚀 **للاختبار السريع:**
1. استخدم `/api/admin/invoices/[id]/test-email` للاختبار بدون إرسال
2. تحقق من Console logs للأخطاء المفصلة
3. تأكد من وجود إيميل للعميل في قاعدة البيانات
