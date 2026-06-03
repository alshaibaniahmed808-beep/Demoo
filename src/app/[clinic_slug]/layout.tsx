import React from 'react';
import { clinicService } from '@/services/clinicService';
import { BrandingInjector } from '@/components/BrandingInjector';

interface ClinicLayoutProps {
  children: React.ReactNode;
  params: { clinic_slug: string };
}

/**
 * Server component: fetches clinic branding on the server and injects
 * CSS custom properties into the <head> so they are available SSR.
 * The client-side BrandingInjector also sets them on the document root
 * for dynamic color switching without a flash.
 */
export default async function ClinicLayout({ children, params }: ClinicLayoutProps) {
  const branding = await clinicService.getBrandingConfig(params.clinic_slug);

  if (!branding) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">عيادة غير موجودة</h1>
          <p className="text-neutral-500">يرجى التحقق من الرابط</p>
        </div>
      </div>
    );
  }

  const cssVars = `
    :root {
      --clinic-primary:   ${branding.primaryColor};
      --clinic-secondary: ${branding.secondaryColor};
      --clinic-accent:    ${branding.accentColor};
      --clinic-text:      ${branding.textColor};
    }
  `;

  return (
    <>
      {/* SSR injection: variables are present before first paint */}
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {/* Client injection: keeps variables in sync on client-side navigation */}
      <BrandingInjector branding={branding} />
      {children}
    </>
  );
}
