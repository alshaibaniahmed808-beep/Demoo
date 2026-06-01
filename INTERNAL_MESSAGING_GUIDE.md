# 📞 نظام التواصل الداخلي - Internal Messaging System

## نظرة عامة

تم إضافة نظام تواصل داخلي احترافي يسمح للمستخدمين بالتواصل مع فريق الدعم والإبلاغ عن الأخطاء واقتراح الميزات **بدون الحاجة لأي بيانات اتصال خارجية**.

## المكونات

### 1. **ContactForm** (`src/components/ContactForm.tsx`)

نموذج تواصل عائم في الزاوية السفلى اليمنى:

```tsx
<ContactForm clinicId="clinic-id" />
```

**الميزات:**
- 💬 نموذج تواصل احترافي
- 📱 متجاوب مع جميع الأجهزة
- 🎨 تصميم حديث مع Gradient
- ✉️ ثلاثة أنواع من الطلبات:
  - 🆘 دعم تقني
  - 🐛 إبلاغ عن خطأ
  - 💡 اقتراح ميزة
- ✅ تأكيد الإرسال
- ⚠️ معالجة الأخطاء

### 2. **MessageNotification** (`src/components/MessageNotification.tsx`)

إشعارات الرسائل الجديدة:

```tsx
<MessageNotification clinicId="clinic-id" />
```

**الميزات:**
- 🔔 إشعارات الرسائل الجديدة
- 📨 عرض عدد الرسائل غير المقروءة
- 📋 قائمة الرسائل
- ✓ وضع علامة كمقروء
- ♻️ تحديث تلقائي كل 30 ثانية

### 3. **API Routes**

#### POST `/api/messages` - إرسال رسالة
```json
{
  "clinicId": "clinic-id",
  "name": "أحمد محمد",
  "subject": "مشكلة في البرنامج",
  "message": "تفاصيل المشكلة...",
  "type": "support"
}
```

#### GET `/api/messages?clinicId=...` - جلب الرسائل
```json
[
  {
    "id": "msg-id",
    "name": "أحمد محمد",
    "subject": "...",
    "message": "...",
    "type": "support",
    "read": false,
    "created_at": "2024-01-01T10:00:00Z"
  }
]
```

#### PATCH `/api/messages/[id]` - تحديث الرسالة (وضع علامة كمقروء)
#### DELETE `/api/messages/[id]` - حذف الرسالة

### 4. **جدول قاعدة البيانات**

```sql
contact_messages {
  id: UUID
  clinic_id: UUID
  name: VARCHAR(255)
  subject: VARCHAR(255)
  message: TEXT
  type: VARCHAR(50) -- support, bug, feature
  read: BOOLEAN
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

## الاستخدام

### في صفحتك الرئيسية:

```tsx
import { ContactForm } from '@/components/ContactForm';
import { MessageNotification } from '@/components/MessageNotification';

export default function Dashboard() {
  const clinicId = 'your-clinic-id';
  
  return (
    <div>
      {/* محتوى الصفحة */}
      
      {/* إضافة نظام التواصل */}
      <ContactForm clinicId={clinicId} />
      <MessageNotification clinicId={clinicId} />
    </div>
  );
}
```

## التصميم

### Contact Form
```
┌─────────────────────────────┐
│  💬 تواصل معنا               │
├─────────────────────────────┤
│ الاسم: [__________]         │
│ النوع: [دعم ▼]             │
│ الموضوع: [__________]       │
│ الرسالة:                    │
│ [_____________________]     │
│ [_____________________]     │
│                             │
│ [📤 إرسال] [إغلاق]          │
└─────────────────────────────┘
```

### Message Notifications
```
┌─ 🔔 (3)─────────────┐
│ الرسائل (3)        │
├───────────────────┤
│ ✓ مشكلة تقنية     │
│   من: أحمد         │
│   شكراً على...    │
│                   │
│ • رسالة جديدة      │
│   من: محمد         │
│   هل يمكن...      │
└───────────────────┘
```

## الميزات المتقدمة

### 🔒 الأمان
- ✅ Row Level Security محفوظ
- ✅ التحقق من صحة البيانات
- ✅ معالجة الأخطاء الشاملة
- ✅ عدم تخزين بيانات حساسة

### ⚡ الأداء
- ✅ تحديث تلقائي كل 30 ثانية
- ✅ lazy loading للرسائل
- ✅ معالجة asynchronous
- ✅ caching محلي

### 📱 التجاوب
- ✅ Mobile-first design
- ✅ Responsive layout
- ✅ Touch-friendly buttons
- ✅ Scrollable messages panel

### 🎨 التصميم
- ✅ Gradient backgrounds
- ✅ Smooth animations
- ✅ Professional styling
- ✅ Dark/Light support

## التخصيص

### تغيير الألوان:
```tsx
// في ContactForm.tsx
className="from-primary-600 to-primary-700" // غيّر هنا
```

### تغيير تكرار التحديث:
```tsx
// في MessageNotification.tsx
const interval = setInterval(fetchMessages, 30000); // بالملي ثانية
```

### إضافة أنواع جديدة:
```tsx
// في ContactForm.tsx
<option value="consultation">👨‍⚕️ استشارة</option>
```

## معالجة الرسائل

### من جانب العيادة:

1. **الاستقبال**
   - يظهر إشعار بالرسائل الجديدة
   - عرض عدد الرسائل غير المقروءة

2. **المراجعة**
   - عرض جميع التفاصيل
   - معرفة نوع الطلب
   - الوقت والتاريخ

3. **الإجراء**
   - الرد على المستخدم
   - حل المشكلة
   - اقتراح الميزات للتطوير

## الخطوات التالية

### لتفعيل النظام:

1. **تشغيل SQL Schema:**
```bash
# انسخ database/002_contact_messages_table.sql
# والصقه في SQL Editor في Supabase
```

2. **استيراد المكونات:**
```tsx
import { ContactForm } from '@/components/ContactForm';
import { MessageNotification } from '@/components/MessageNotification';
```

3. **إضافة إلى صفحتك:**
```tsx
export default function App() {
  return (
    <>
      {/* محتوى */}
      <ContactForm clinicId="..." />
      <MessageNotification clinicId="..." />
    </>
  );
}
```

## أمثلة حقيقية

### مثال 1: مشكلة تقنية
```
الاسم: د. أحمد
النوع: 🆘 دعم تقني
الموضوع: لا أستطيع تسجيل دخول
الرسالة: عند محاولة تسجيل الدخول أحصل على خطأ 404
```

### مثال 2: إبلاغ خطأ
```
الاسم: سارة محمود
النوع: 🐛 إبلاغ عن خطأ
الموضوع: أرقام الدور تتكرر
الرسالة: لاحظت أن أرقام الدور تتكرر عندما أضيف مرضى جدد
```

### مثال 3: اقتراح ميزة
```
الاسم: محمد علي
النوع: 💡 اقتراح ميزة
الموضوع: إضافة تنبيهات صوتية
الرسالة: يمكن إضافة تنبيهات صوتية عند استدعاء كل مريض
```

## الحالات الاستثنائية

### ❌ الخطأ: "البيانات ناقصة"
**الحل:** تأكد من ملء جميع الحقول المطلوبة (*)

### ❌ الخطأ: "حدث خطأ في الخادم"
**الحل:** 
- تحقق من اتصالك بالإنترنت
- أعد تحميل الصفحة
- تحقق من console للأخطاء

### ❌ الخطأ: "لم تصل الرسالة"
**الحل:**
- تأكد من إرسالك بنجاح (رسالة نجاح خضراء)
- تحقق من الرسائل المرسلة
- جرب إرسال رسالة تجريبية

## الإحصائيات

### يمكنك متابعة:
- ✓ عدد الرسائل الإجمالية
- ✓ عدد الرسائل المقروءة
- ✓ أنواع الطلبات الشائعة
- ✓ أوقات الذروة

## نصائح لأفضل استخدام

1. **ضع المكونات في المكان المناسب:**
   - في Dashboard الرئيسية
   - في صفحة كل عيادة
   - في Layout الرئيسي

2. **راقب الرسائل باستمرار:**
   - رد على المستخدمين بسرعة
   - احل المشاكل فوراً
   - شكّر على الاقتراحات

3. **استخدم البيانات للتحسين:**
   - حلل الأخطاء الشائعة
   - طوّر الميزات المطلوبة
   - حسّن الخدمة

## الدعم

للمزيد من المساعدة:
- 💬 استخدم نفس نظام التواصل
- 📖 اقرأ التوثيق
- 🔍 تحقق من الأمثلة

---

**تم تطويره بـ ❤️ لمنصة Novro**
