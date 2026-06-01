'use client';

import React, { useEffect } from 'react';
import { BrandingConfig } from '@/types';

interface DynamicBrandingProviderProps {
  children: React.ReactNode;
  branding: BrandingConfig;
}

export const DynamicBrandingProvider: React.FC<DynamicBrandingProviderProps> = ({
  children,
  branding,
}) => {
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--primary-color', branding.primaryColor);
    root.style.setProperty('--secondary-color', branding.secondaryColor);
    root.style.setProperty('--accent-color', branding.accentColor);
    root.style.setProperty('--text-color', branding.textColor);

    const style = document.createElement('style');
    style.textContent = `
      :root {
        --color-primary: ${branding.primaryColor};
        --color-secondary: ${branding.secondaryColor};
        --color-accent: ${branding.accentColor};
        --color-text: ${branding.textColor};
      }

      .bg-primary {
        background-color: var(--color-primary);
      }

      .bg-secondary {
        background-color: var(--color-secondary);
      }

      .bg-accent {
        background-color: var(--color-accent);
      }

      .text-primary {
        color: var(--color-primary);
      }

      .text-secondary {
        color: var(--color-secondary);
      }

      .text-accent {
        color: var(--color-accent);
      }

      .border-primary {
        border-color: var(--color-primary);
      }

      .hover\:bg-primary:hover {
        background-color: var(--color-primary);
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [branding]);

  return <>{children}</>;
};