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
        setFormData({
          patientName: '',
          patientPhone: '',
          patientIdNumber: '',
          notes: '',
        });
        setTimeout(onClose, 1000);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 rtl" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">إضافة مريض جديد</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم المريض *
            </label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleInputChange}
              placeholder="أدخل اسم المريض"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الهاتف
            </label>
            <input
              type="tel"
              name="patientPhone"
              value={formData.patientPhone}
              onChange={handleInputChange}
              placeholder="ادخل رقم الهاتف (اختياري)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الملف / الهوية
            </label>
            <input
              type="text"
              name="patientIdNumber"
              value={formData.patientIdNumber}
              onChange={handleInputChange}
              placeholder="رقم الهوية أو رقم الملف (اختياري)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="أي ملاحظات إضافية..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {loading ? 'جاري الإضافة...' : '✅ إضافة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
            >
              ❌ إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};