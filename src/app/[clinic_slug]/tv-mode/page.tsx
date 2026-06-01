import React from 'react';
import { TVModeFullscreen } from '@/components/TVModeFullscreen';

interface PageProps {
  params: {
    clinic_slug: string;
  };
}

export default async function TVModePage({ params }: PageProps) {
  // في الإنتاج، ستحتاج إلى جلب clinic_id و doctor_id من قاعدة البيانات
  const { clinic_slug } = params;

  // Example clinic and doctor IDs (replace with actual data)
  const clinicId = 'example-clinic-id';
  const doctorId = 'example-doctor-id';

  return (
    <TVModeFullscreen
      clinicId={clinicId}
      doctorId={doctorId}
    />
  );
}
