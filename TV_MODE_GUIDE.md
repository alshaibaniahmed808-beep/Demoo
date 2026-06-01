// ============================================
// README - TV Mode Feature
// ============================================

# 📺 TV Mode Feature - نمط العرض على الشاشة الكبيرة

## نظرة عامة

TV Mode هو نمط عرض متقدم مصمم خصيصاً لعرض معلومات الطابور على شاشات الحائط (TV/Monitor) في العيادات والمراكز الطبية.

## المميزات الرئيسية

### 🎯 **العرض الديناميكي**
- عرض المريض الحالي برقم دور ضخم وواضح
- عرض قائمة المرضى التاليين بتصميم احترافي
- تحديث فوري عند التغييرات (Realtime)
- ساعة رقمية وتاريخ ديناميكي

### 📱 **دعم الأجهزة**
```
✅ شاشات التلفاز
✅ شاشات المراقبة
✅ التابلت
✅ الهواتف الذكية
✅ شاشات الحائط
```

### 🖥️ **وضع ملء الشاشة**
- دعم Fullscreen API
- حفل التوجه الأفقي (Landscape) للأجهزة المحمولة
- إخفاء شريط العنوان والتنقل
- تحكم كامل بالعرض

### 🎨 **التصميم الاحترافي**
```
✅ Gradient خلفية احترافية
✅ شفافية وتأثيرات Blur
✅ حدود مضيئة
✅ رموز وEmoji
✅ Animations سلسة
```

### ⚡ **الأداء**
- تحديث فوري بدون تأخير
- استهلاك موارد منخفض
- تحسين لشاشات 4K
- دعم العرض المستمر

## المكونات

### 1. **TVMode** (`src/components/TVMode.tsx`)
مكون TV Mode الرئيسي:
```typescript
<TVMode 
  clinicId="clinic-id"
  doctorId="doctor-id"
  doctor={doctorData}
/>
```

**الميزات:**
- عرض المريض الحالي في الوسط
- قائمة المرضى التاليين على اليمين
- إحصائيات في الأعلى
- ساعة وتاريخ حية

### 2. **TVModeFullscreen** (`src/components/TVModeFullscreen.tsx`)
نسخة متقدمة من TV Mode:
```typescript
<TVModeFullscreen 
  clinicId="clinic-id"
  doctorId="doctor-id"
/>
```

**الميزات الإضافية:**
- زر ملء الشاشة
- قفل التوجه على الأجهزة المحمولة
- معالجة أفضل للشاشات الكبيرة

### 3. **ClinicController** (`src/components/ClinicController.tsx`)
متحكم للتبديل بين الأوضاع:
```typescript
<ClinicController 
  clinicId="clinic-id"
  doctorId="doctor-id"
  doctor={doctorData}
>
  {children}
</ClinicController>
```

**الميزات:**
- زر toggle بين Dashboard و TV Mode
- تبديل سلس بين الأوضاع
- يثبت في أسفل اليمين

## الاستخدام

### الطريقة 1: استخدام TVMode في تطبيقك
```tsx
import { TVMode } from '@/components/TVMode';

export default function MyClinic() {
  return (
    <TVMode 
      clinicId="clinic-123"
      doctorId="doctor-456"
      doctor={doctor}
    />
  );
}
```

### الطريقة 2: استخدام ClinicController للتبديل
```tsx
import { ClinicController } from '@/components/ClinicController';

export default function MyClinic() {
  return (
    <ClinicController 
      clinicId="clinic-123"
      doctorId="doctor-456"
      doctor={doctor}
    >
      <YourContent />
    </ClinicController>
  );
}
```

### الطريقة 3: صفحة مخصصة للـ TV Mode
```
/[clinic_slug]/tv-mode
```

## Keyboard Shortcuts (اختياري)

```
'T' - تبديل TV Mode
'F' - ملء الشاشة
'Esc' - خروج من ملء الشاشة
'R' - إعادة تحميل
```

## الألوان والتصميم

### Color Scheme:
```
✅ Gradient Novro: من الأزرق إلى التركواز
✅ Overlay البيضاء للشفافية
✅ Borders بيضاء فاتحة
✅ Text أبيض واضح
```

### Typography:
```
✅ Headers: Poppins Bold (Display)
✅ Body: Inter Regular
✅ Numbers: Large & Bold
```

## الإحصائيات والمراقبة

### المعلومات المعروضة:
1. **المريض الحالي**
   - رقم الدور
   - اسم المريض
   - حالة (استدعاء / استشارة)

2. **المرضى التاليون**
   - أول 5 مرضى في الانتظار
   - رقم كل مريض
   - ترتيبه في الطابور

3. **الإحصائيات**
   - عدد المنتظرين
   - عدد المستدعين
   - عدد قيد الاستشارة

4. **الوقت والتاريخ**
   - ساعة حية
   - تاريخ كامل

## التخصيص

### تغيير الألوان:
```tsx
// في tailwind.config.ts
colors: {
  primary: { ... },
  accent: { ... },
  // تخصيص
}
```

### تغيير حجم الخط:
```tsx
// في TVMode.tsx
<p className="text-9xl"> // غيّر الحجم
```

### تغيير عدد المرضى المعروضين:
```tsx
// في TVMode.tsx
slice(0, 5) // غيّر 5 إلى أي رقم
```

## Responsive Design

### مختلف الأحجام:
```
📱 Mobile: 375px (Fullscreen mode)
📱 Tablet: 768px
🖥️ Desktop: 1024px+
🖥️ 4K: 3840px+
```

## Performance Tips

1. **استخدم TV Mode على شاشات مخصصة**
2. **فعّل ملء الشاشة للعرض الأمثل**
3. **تجنب التطبيقات الأخرى على نفس الجهاز**
4. **استخدم اتصال إنترنت مستقر**
5. **حدّث المتصفح دورياً**

## المشاكل الشائعة وحلولها

### ❌ البيانات لا تحدّث
✅ تحقق من اتصال الإنترنت
✅ أعد تحميل الصفحة
✅ تحقق من الـ console للأخطاء

### ❌ ملء الشاشة لا يعمل
✅ استخدم متصفح حديث (Chrome, Firefox, Safari)
✅ تأكد من عدم تشغيل متصفح في وضع الحماية
✅ اسمح بالإذن للموقع

### ❌ النصوص غير واضحة
✅ اضبط دقة الشاشة
✅ غيّر حجم الخط في التكوين
✅ ابعد من الشاشة قليلاً

## المستقبل

### الميزات المخطط إضافتها:
- [ ] Sound alerts عند استدعاء المريض
- [ ] Background music اختيارية
- [ ] QR Code للمريض
- [ ] تقارير مباشرة
- [ ] إعدادات مخصصة
- [ ] Multiple doctors view
- [ ] Integration مع إعدادات العيادة

## الدعم

للمزيد من المساعدة:
- 📧 Email: support@novro.clinic
- 📱 WhatsApp: +966 XX XXX XXXX
- 🌐 Website: www.novro.clinic

---

**تم تطويره بـ ❤️ لمشروع Novro**
