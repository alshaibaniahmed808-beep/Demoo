'use client';

import React, { useState } from 'react';
import { queueService } from '@/services/queueService';

interface AddPatientModalProps {
  clinicId: string;
  doctorId: string;
  onClose: () => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  clinicId,
  doctorId,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientIdNumber: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientName.trim()) {
      setError('يرجى إدخال اسم المريض');
      return;
    }

    setLoading(true);

    try {
      const result = await queueService.addPatientToQueue(
        clinicId,
        doctorId,
        formData.patientName,
        formData.patientPhone || undefined,
        formData.patientIdNumber || undefined,
        formData.notes || undefined
      );

      if (result) {
        setSuccess(true);
        setFormData({
          patientName: '',
          patientPhone: '',
          patientIdNumber: '',
          notes: '',
        });
        setTimeout(onClose, 1500);
      } else {
        setError('فشل في إضافة المريض');
      }
    } catch (err) {
      setError((err as Error).message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 rtl" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animation-scale-in">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-1">
            إضافة مريض جديد
          </h2>
          <p className="text-sm text-neutral-500">أدخل معلومات المريض لإضافته للطابور</p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-lg font-semibold text-green-600">تم إضافة المريض بنجاح!</p>
            <p className="text-sm text-neutral-500 mt-2">تم إضافة {formData.patientName} للطابور</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Patient Name */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                اسم المريض *
              </label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                placeholder="أدخل الاسم الكامل"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition font-medium"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                name="patientPhone"
                value={formData.patientPhone}
                onChange={handleInputChange}
                placeholder="05xxxxxxxx"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition font-medium"
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                رقم الهوية / الملف
              </label>
              <input
                type="text"
                name="patientIdNumber"
                value={formData.patientIdNumber}
                onChange={handleInputChange}
                placeholder="1xxxxxxxxx"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition font-medium"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                ملاحظات
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="أي ملاحظات إضافية..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition font-medium resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 text-sm font-medium">❌ {error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-neutral-400 disabled:to-neutral-500 text-white font-bold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>إضافة</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                <span>❌</span>
                <span>إلغاء</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};