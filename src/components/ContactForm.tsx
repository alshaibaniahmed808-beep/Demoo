'use client';

import React, { useState } from 'react';

interface ContactFormProps {
  clinicId: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({ clinicId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
    type: 'support', // support, bug, feature
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // حفظ الرسالة في قاعدة البيانات
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicId,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل إرسال الرسالة');
      }

      setSuccess(true);
      setFormData({
        name: '',
        subject: '',
        message: '',
        type: 'support',
      });

      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      setError((err as Error).message || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-110"
          title="تواصل معنا"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-end md:justify-center z-50 p-4 rtl" dir="rtl">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animation-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">تواصل معنا</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            {success ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-lg font-semibold text-green-600">تم إرسال رسالتك بنجاح!</p>
                <p className="text-sm text-neutral-600 mt-2">سيتم الرد عليك قريباً</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    الاسم *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="أدخل اسمك"
                    required
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    نوع الطلب *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition font-medium"
                  >
                    <option value="support">🆘 دعم تقني</option>
                    <option value="bug">🐛 إبلاغ عن خطأ</option>
                    <option value="feature">💡 اقتراح ميزة</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    الموضوع *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="ملخص طلبك"
                    required
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    الرسالة *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="اشرح مشكلتك أو طلبك بالتفصيل..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition resize-none font-medium"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
                  </div>
                )}

                {/* Info Message */}
                <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
                  <p className="text-primary-700 text-xs font-medium">
                    ℹ️ سيتم الرد على رسالتك خلال 24 ساعة
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-neutral-400 disabled:to-neutral-500 text-white font-bold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <span>📤</span>
                        <span>إرسال الرسالة</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 px-4 rounded-lg transition duration-200"
                  >
                    إغلاق
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};