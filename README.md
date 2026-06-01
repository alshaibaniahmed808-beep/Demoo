# 🏥 Novro - SaaS Queue Management Platform

**منصة نوفرو لإدارة وتتبع طوابير الانتظار في العيادات والمراكز الطبية**

## 📋 نظرة عامة

Novro هي منصة سحابية (SaaS) متعددة المستأجرين (Multi-Tenant) مصممة لتحسين تجربة المرضى في العيادات والمراكز الطبية من خلال:

- ✅ إدارة طوابير الانتظار بكفاءة عالية
- ✅ تتبع حالة المريض في الوقت الفعلي (Realtime)
- ✅ واجهات محسنة للهواتف (Mobile First)
- ✅ هوية بصرية ديناميكية لكل عيادة (Dynamic Branding)
- ✅ أمان عالي مع عزل البيانات (Row Level Security)

## 🛠️ التقنيات المستخدمة

### Frontend
- **Next.js 14** (App Router)
- **React 18** مع TypeScript الصارم
- **Tailwind CSS** مع دعم RTL للواجهات العربية

### Backend & Database
- **Supabase** (PostgreSQL)
- **WebSockets** للبث الحي (Realtime)
- **Row Level Security (RLS)** لحماية البيانات

## 📁 هيكل المشروع

```
novro/
├── database/
│   └── 001_init_schema.sql          # SQL Schema متكامل
├── src/
│   ├── types/
│   │   └── index.ts                 # Type Definitions
│   ├── lib/
│   │   ├── supabase.ts              # Supabase Client
│   │   ├── debounce.ts              # Debounce Utility
│   │   └── realtimeService.ts       # WebSocket Service
│   ├── services/
│   │   ├── clinicService.ts         # Clinic Business Logic
│   │   └── queueService.ts          # Queue Management Logic
│   ├── components/
│   │   ├── ReceptionistControlPanel.tsx
│   │   ├── AddPatientModal.tsx
│   │   ├── LivePatientTracker.tsx
│   │   └── DynamicBrandingProvider.tsx
│   └── app/
│       └── [clinic_slug]/
│           └── layout.tsx            # Dynamic Layout
├── tailwind.config.ts
├── package.json
├── .env.local
└── README.md
```

## 🚀 البدء السريع

### 1. التثبيت

```bash
git clone https://github.com/alshaibaniahmed808-beep/Demoo.git
cd Demoo
npm install
```

### 2. إعداد البيئة

أنشئ ملف `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. إعداد قاعدة البيانات

قم بتشغيل SQL Schema في Supabase:
```bash
# انسخ محتوى database/001_init_schema.sql
# والصقه في SQL Editor في Supabase
```

### 4. تشغيل المشروع

```bash
npm run dev
```

افتح `http://localhost:3000`

## 📊 معمارية قاعدة البيانات

### الجداول الرئيسية

1. **clinics** - جدول العيادات
2. **doctors** - جدول الأطباء
3. **queue_items** - جدول طابور الانتظار
4. **receptionist_sessions** - جدول جلسات الموظفين
5. **queue_analytics** - جدول التحليلات

### الفهارس (Indexes)

- `idx_queue_items_clinic_id` - سرعة الاستعلام
- `idx_queue_items_doctor_id` - سرعة البحث عن طبيب
- `idx_queue_items_status` - سرعة البحث حسب الحالة

### الأمان (Row Level Security)

```sql
-- لا يمكن لأي عيادة رؤية بيانات عيادة أخرى
CREATE POLICY "queue_items_select_own_clinic" ON queue_items
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM receptionist_sessions 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );
```

## 🎨 الهوية البصرية الديناميكية

يتم تطبيق ألوان العيادة ديناميكياً عبر CSS Variables:

```typescript
// في DynamicBrandingProvider
root.style.setProperty('--primary-color', branding.primaryColor);
root.style.setProperty('--secondary-color', branding.secondaryColor);
```

ثم استخدام الألوان في Tailwind:

```html
<div class="bg-primary text-secondary">...</div>
```

## 📱 المكونات الرئيسية

### ReceptionistControlPanel

لوحة تحكم الموظف مع:
- جدول المرضى المنتظرين
- زر استدعاء المريض القادم
- إدارة حالات المرضى

### LivePatientTracker

واجهة تتبع المريض مع:
- بحث بـ Debounce
- عرض رقم الدور
- حساب المرضى أمام المريض
- تحديثات حية (Realtime)

## 🔔 البث الحي (Realtime)

```typescript
const subscription = realtimeService.subscribeToQueueUpdates(
  clinicId,
  doctorId,
  (payload) => {
    // تحديث الواجهة تلقائياً
    setQueueItems((prev) => [...prev, payload.new]);
  }
);
```

**المميزات:**
- ✅ الاستماع فقط للطبيب المحدد (تحسين الأداء)
- ✅ إعادة الاتصال التلقائي عند انقطاع الإنترنت
- ✅ معالجة الأخطاء المتقدمة

## 📈 الخطوات التالية

- [ ] إضافة لوحة تحليلات متقدمة
- [ ] نظام الإشعارات (Push Notifications)
- [ ] دعم عدة لغات (i18n)
- [ ] نظام الدفع والاشتراكات
- [ ] تطبيق موبايل (React Native)

## 📞 الدعم

للمساعدة والأسئلة:
- 📧 Email: support@novro.clinic
- 💬 WhatsApp: +966 XX XXX XXXX

## 📄 الترخيص

MIT License - شاهد LICENSE.md

---

**تم بناؤه بـ ❤️ لتحسين تجربة المرضى**