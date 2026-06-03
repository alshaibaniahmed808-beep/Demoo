'use client';

import { useEffect } from 'react';
import { BrandingConfig } from '@/types';

interface Props {
  branding: BrandingConfig;
}

/**
 * Client component that sets clinic CSS variables on the document root.
 * Works alongside the SSR <style> tag in the layout for zero-flash hydration.
 */
export function BrandingInjector({ branding }: Props) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--clinic-primary',   branding.primaryColor);
    root.style.setProperty('--clinic-secondary', branding.secondaryColor);
    root.style.setProperty('--clinic-accent',    branding.accentColor);
    root.style.setProperty('--clinic-text',      branding.textColor);
  }, [branding]);

  return null;
}
