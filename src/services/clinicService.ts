// ============================================
// Clinic Service
// ============================================

import { supabase } from '@/lib/supabase';
import { Clinic, BrandingConfig } from '@/types';

export const clinicService = {
  async getClinicBySlug(slug: string): Promise<Clinic | null> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching clinic:', error);
        return null;
      }

      return data as Clinic;
    } catch (err) {
      console.error('Clinic fetch error:', err);
      return null;
    }
  },

  async getBrandingConfig(slug: string): Promise<BrandingConfig | null> {
    const clinic = await this.getClinicBySlug(slug);

    if (!clinic) return null;

    return {
      primaryColor: clinic.primary_color,
      secondaryColor: clinic.secondary_color,
      accentColor: clinic.accent_color,
      textColor: clinic.text_color,
      logoUrl: clinic.logo_url,
    };
  },

  async updateClinic(clinicId: string, updates: Partial<Clinic>) {
    const { data, error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};