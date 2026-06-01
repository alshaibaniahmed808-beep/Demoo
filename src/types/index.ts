// ============================================
// Novro - Type Definitions
// ============================================

export type QueueStatus = 'waiting' | 'calling' | 'active' | 'done';

export interface Clinic {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  subscription_plan: 'starter' | 'pro' | 'enterprise';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  name: string;
  specialization: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  registration_number: string | null;
  profile_image_url: string | null;
  average_consultation_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface QueueItem {
  id: string;
  clinic_id: string;
  doctor_id: string;
  patient_name: string;
  patient_phone: string | null;
  patient_id_number: string | null;
  ticket_number: number;
  status: QueueStatus;
  position_in_queue: number | null;
  called_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceptionistSession {
  id: string;
  clinic_id: string;
  doctor_id: string;
  user_id: string;
  session_token: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
  expires_at: string;
}

export interface QueueAnalytics {
  id: string;
  clinic_id: string;
  doctor_id: string;
  date: string;
  total_patients: number;
  completed_patients: number;
  average_wait_time_minutes: number;
  average_consultation_time_minutes: number;
  no_show_count: number;
  created_at: string;
}

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  logoUrl: string | null;
}