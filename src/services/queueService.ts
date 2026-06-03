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
          patient_phone: patientPhone ?? null,
          patient_id_number: patientIdNumber ?? null,
          ticket_number: ticketNumber,
          status: 'waiting',
          notes: notes ?? null,
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
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`)
      .order('ticket_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching next ticket:', error);
      return 1;
    }

    return (data?.[0]?.ticket_number ?? 0) + 1;
  },

  async updateQueueStatus(queueItemId: string, status: QueueStatus): Promise<QueueItem> {
    const updateData: Record<string, unknown> = { status };

    if (status === 'calling') updateData.called_at    = new Date().toISOString();
    if (status === 'active')  updateData.started_at   = new Date().toISOString();
    if (status === 'done')    updateData.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('queue_items')
      .update(updateData)
      .eq('id', queueItemId)
      .select()
      .single();

    if (error) throw error;
    return data as QueueItem;
  },

  async getQueueByDoctor(doctorId: string, clinicId: string): Promise<QueueItem[]> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('clinic_id', clinicId)
      .in('status', ['waiting', 'calling', 'active'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as QueueItem[];
  },

  async searchPatient(
    clinicId: string,
    doctorId: string,
    searchQuery: string
  ): Promise<QueueItem | null> {
    const ticketNum = parseInt(searchQuery, 10);
    const isNumber = !isNaN(ticketNum);

    // Try exact ticket number match first, then name search
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('doctor_id', doctorId)
      .or(
        isNumber
          ? `ticket_number.eq.${ticketNum},patient_name.ilike.%${searchQuery}%`
          : `patient_name.ilike.%${searchQuery}%`
      )
      .not('status', 'eq', 'done')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Patient search error:', error);
      return null;
    }

    return data as QueueItem | null;
  },

  async getPatientPosition(doctorId: string, queueItemId: string): Promise<number> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('id')
      .eq('doctor_id', doctorId)
      .in('status', ['waiting', 'calling'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    const idx = (data ?? []).findIndex((item) => item.id === queueItemId);
    return idx === -1 ? 0 : idx + 1;
  },

  async removePatientFromQueue(queueItemId: string): Promise<void> {
    const { error } = await supabase
      .from('queue_items')
      .delete()
      .eq('id', queueItemId);

    if (error) throw error;
  },
};
