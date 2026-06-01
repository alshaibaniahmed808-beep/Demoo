import React from 'react';
import { clinicService } from '@/services/clinicService';
import { DynamicBrandingProvider } from '@/components/DynamicBrandingProvider';

interface ClinicLayoutProps {
  children: React.ReactNode;
  params: {
    clinic_slug: string;
  };
}

export default async function ClinicLayout({
  children,
  params,
}: ClinicLayoutProps) {
  const { clinic_slug } = params;

  const branding = await clinicService.getBrandingConfig(clinic_slug);

  if (!branding) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">عيادة غير موجودة</h1>
          <p className="text-gray-600">يرجى التحقق من الرابط</p>
        </div>
      </div>
    );
  }

  return (
    <DynamicBrandingProvider branding={branding}>
      <html lang="ar" dir="rtl">
        <head>
          <style>
            {`
              :root {
                --primary-color: ${branding.primaryColor};
                --secondary-color: ${branding.secondaryColor};
                --accent-color: ${branding.accentColor || '#10B981'};
                --text-color: ${branding.textColor};
              }
            `}
          </style>
        </head>
        <body className="bg-gray-50">{children}</body>
      </html>
    </DynamicBrandingProvider>
  );
}