// ============================================
// Queue Service
// ============================================

import { supabase } from '@/lib/supabase';
import { QueueItem, QueueStatus } from '@/types';

export const queueService = {
  async addPatientToQueue(
    clinicId: string,
    doctorId: string,
    patientName: string,
    patientPhone?: string,
    patientIdNumber?: string,
    notes?: string
  ): Promise<QueueItem | null> {
    try {
      const ticketNumber = await this.getNextTicketNumber(doctorId, clinicId);

      const { data, error } = await supabase
        .from('queue_items')
        .insert({
          clinic_id: clinicId,
          doctor_id: doctorId,
          patient_name: patientName,
          patient_phone: patientPhone,
          patient_id_number: patientIdNumber,
          ticket_number: ticketNumber,
          status: 'waiting',
          notes: notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as QueueItem;
    } catch (err) {
      console.error('Error adding patient to queue:', err);
      return null;
    }
  },

  async getNextTicketNumber(doctorId: string, clinicId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('queue_items')
      .select('ticket_number')
      .eq('doctor_id', doctorId)
      .eq('clinic_id', clinicId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('ticket_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching next ticket:', error);
      return 1;
    }

    return (data?.[0]?.ticket_number || 0) + 1;
  },

  async updateQueueStatus(queueItemId: string, status: QueueStatus) {
    const updateData: any = { status };

    if (status === 'calling') {
      updateData.called_at = new Date().toISOString();
    } else if (status === 'active') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'done') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('queue_items')
      .update(updateData)
      .eq('id', queueItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getQueueByDoctor(doctorId: string, clinicId: string) {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('clinic_id', clinicId)
      .in('status', ['waiting', 'calling', 'active'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as QueueItem[];
  },

  async searchPatient(
    clinicId: string,
    doctorId: string,
    searchQuery: string
  ) {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('doctor_id', doctorId)
      .or(`patient_name.ilike.%${searchQuery}%,ticket_number.eq.${searchQuery}`)
      .single();

    if (error) {
      console.error('Patient search error:', error);
      return null;
    }

    return data as QueueItem;
  },

  async getPatientPosition(
    doctorId: string,
    queueItemId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('id')
      .eq('doctor_id', doctorId)
      .in('status', ['waiting', 'calling'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    const position = data?.findIndex((item) => item.id === queueItemId) || -1;
    return position + 1;
  },

  async removePatientFromQueue(queueItemId: string) {
    const { error } = await supabase
      .from('queue_items')
      .delete()
      .eq('id', queueItemId);

    if (error) throw error;
  },
};