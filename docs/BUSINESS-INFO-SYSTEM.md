# نظام إدارة المعلومات التجارية المركزي

## نظرة عامة

تم تطوير نظام مركزي لإدارة وتحديث المعلومات التجارية للشركة عبر جميع صفحات التطبيق ووثائق الفواتير من خلال صفحة إعدادات الأدمن، مما يضمن الاستخدام المتسق والديناميكي لمعلومات الاتصال في جميع أنحاء التطبيق.

## المعلومات التجارية المدعومة

### معلومات الشركة الأساسية
- **اسم الشركة**: PRO FLEET
- **البريد الإلكتروني**: info@profleet.app
- **رقم الهاتف**: +966 53 997 7837
- **العنوان**: الرياض، المملكة العربية السعودية
- **الموقع الإلكتروني**: www.profleet.app
- **النطاق**: profleet.app

### معلومات السجل التجاري
- **السجل التجاري**: 4030522610
- **السجل التجاري الموحد**: 7033220067
- **الرقم الموحد**: 8002440411

### العنوان الوطني
- **العنوان الوطني المختصر**: JENA7503
- **رقم المبنى**: 7503
- **الرقم الفرعي**: 2695
- **الرمز البريدي**: 23621
- **الحي**: النعيم
- **الشارع**: الأمير سلطان
- **العنوان الوطني الكامل**: رقم المبنى 7503 – الرقم الفرعي 2695\nالرمز البريدي 23621 – الحي النعيم\nالشارع الأمير سلطان

## الهيكل التقني

### 1. وحدة إعدادات النظام (`/src/lib/system-settings.ts`)

#### الدوال المتاحة:
- `getSystemSettings()`: جلب جميع إعدادات النظام مع التخزين المؤقت
- `getCompanyPhone()`: جلب رقم هاتف الشركة
- `getCompanyInfo()`: جلب معلومات الشركة الأساسية
- `getBusinessRegistrationInfo()`: جلب معلومات السجل التجاري
- `getNationalAddressInfo()`: جلب معلومات العنوان الوطني
- `getCompleteBusinessInfo()`: جلب جميع المعلومات التجارية
- `clearSettingsCache()`: مسح التخزين المؤقت للإعدادات

#### مثال الاستخدام:
```typescript
import { getCompanyInfo, getCompleteBusinessInfo } from '@/lib/system-settings';

// جلب معلومات الشركة الأساسية
const companyInfo = await getCompanyInfo();

// جلب جميع المعلومات التجارية
const businessInfo = await getCompleteBusinessInfo();
```

### 2. API الإعدادات العامة (`/src/app/api/settings/public/route.ts`)

نقطة نهاية عامة لجلب معلومات الشركة للاستخدام من جانب العميل بدون مصادقة.

**الطلب**: `GET /api/settings/public`

**الاستجابة**:
```json
{
  "companyInfo": {
    "name": "PRO FLEET",
    "email": "info@profleet.app",
    "phone": "+966 53 997 7837",
    "address": "الرياض، المملكة العربية السعودية",
    "website": "www.profleet.app",
    "domain": "profleet.app",
    "commercialRegister": "4030522610",
    "unifiedCommercialRegister": "7033220067",
    "unifiedNumber": "8002440411",
    "shortNationalAddress": "JENA7503",
    "buildingNumber": "7503",
    "subNumber": "2695",
    "postalCode": "23621",
    "district": "النعيم",
    "street": "الأمير سلطان",
    "fullNationalAddress": "رقم المبنى 7503 – الرقم الفرعي 2695\nالرمز البريدي 23621 – الحي النعيم\nالشارع الأمير سلطان"
  }
}
```

### 3. Hook React (`/src/hooks/useCompanyInfo.ts`)

Hook لجلب معلومات الشركة من API العام للاستخدام في مكونات React.

```typescript
import { useCompanyInfo } from '@/hooks/useCompanyInfo';

function MyComponent() {
  const { companyInfo, loading } = useCompanyInfo();
  
  if (loading) return <div>جاري التحميل...</div>;
  
  return (
    <div>
      <h1>{companyInfo.name}</h1>
      <p>{companyInfo.email}</p>
      <p>{companyInfo.phone}</p>
    </div>
  );
}
```

## الصفحات والمكونات المحدثة

### 1. الصفحة الرئيسية (`/src/app/[locale]/page.tsx`)
- تستخدم `useCompanyInfo()` hook
- تعرض رقم الهاتف والبريد الإلكتروني والموقع ديناميكياً
- تعرض معلومات السجل التجاري والعنوان الوطني

### 2. صفحة الشروط والأحكام (`/src/app/[locale]/terms/page.tsx`)
- تستخدم `useCompanyInfo()` hook
- تعرض معلومات الاتصال ديناميكياً
- تعرض رقم السجل التجاري في النص

### 3. APIs الفواتير
جميع APIs التالية تستخدم `getCompanyInfo()` لجلب معلومات الشركة:
- `/src/app/api/admin/invoices/[id]/pdf/route.ts`
- `/src/app/api/admin/invoices/[id]/send-email/route.ts`
- `/src/app/api/accountant/invoices/[id]/pdf/route.ts`
- `/src/app/api/accountant/invoices/[id]/send-email/route.ts`
- `/src/app/api/customer/clearance-invoices/[id]/pdf/route.ts`

## قاعدة البيانات

### جدول `system_settings`
```sql
CREATE TABLE system_settings (
  id VARCHAR PRIMARY KEY,
  key VARCHAR UNIQUE NOT NULL,
  value VARCHAR NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### مفاتيح الإعدادات:
- `business.companyName`
- `business.companyEmail`
- `business.companyPhone`
- `business.companyAddress`
- `business.website`
- `business.domain`
- `business.commercialRegister`
- `business.unifiedCommercialRegister`
- `business.unifiedNumber`
- `business.shortNationalAddress`
- `business.buildingNumber`
- `business.subNumber`
- `business.postalCode`
- `business.district`
- `business.street`
- `business.fullNationalAddress`

## السكريبتات

### إعداد المعلومات التجارية
```bash
npm run db:setup-business-info
```

يقوم هذا السكريبت بإضافة/تحديث جميع المعلومات التجارية في قاعدة البيانات.

## التخزين المؤقت

- يتم تخزين الإعدادات مؤقتاً لمدة 5 دقائق لتقليل الحمل على قاعدة البيانات
- يتم مسح التخزين المؤقت تلقائياً عند تحديث الإعدادات من صفحة الأدمن
- يمكن مسح التخزين المؤقت يدوياً باستخدام `clearSettingsCache()`

## الأمان

- API الإعدادات العامة للقراءة فقط وآمن للاستهلاك العام
- تحديث الإعدادات يتطلب صلاحيات الأدمن
- جميع APIs الفواتير تطبق التحكم في الوصول القائم على الأدوار

## الاستخدام في المستقبل

### إضافة معلومة تجارية جديدة:
1. إضافة المفتاح والقيمة في `DEFAULT_SETTINGS`
2. إضافة المفتاح في قاعدة البيانات
3. تحديث الدوال المساعدة حسب الحاجة
4. تحديث واجهة `CompanyInfo` في hook

### تحديث المعلومات:
- من صفحة إعدادات الأدمن
- أو مباشرة في قاعدة البيانات
- أو باستخدام سكريبت التحديث

## المزايا

1. **إدارة مركزية**: جميع المعلومات التجارية في مكان واحد
2. **تحديث ديناميكي**: تغيير المعلومات من الأدمن ينعكس فوراً
3. **أداء محسن**: تخزين مؤقت ذكي لتقليل استعلامات قاعدة البيانات
4. **سهولة الصيانة**: لا حاجة لتحديث ملفات متعددة
5. **اتساق البيانات**: نفس المعلومات في جميع أنحاء التطبيق
