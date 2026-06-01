// ============================================
// Utilities: TV Mode
// ============================================

import { QueueItem } from '@/types';

/**
 * احسب مدة الانتظار بناءً على رقم الدور
 */
export function calculateEstimatedWaitTime(
  patientTicket: number,
  currentTicket: number,
  avgConsultationTime: number = 15
): number {
  const difference = currentTicket - patientTicket;
  if (difference <= 0) return 0;
  return difference * avgConsultationTime;
}

/**
 * حول الوقت إلى صيغة مقروءة (مثل: 5 دقائق، ساعة واحدة)
 */
export function formatWaitTime(minutes: number): string {
  if (minutes === 0) return 'الآن';
  if (minutes < 60) return `${minutes} دقيقة`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) return `${hours} ساعة`;
  return `${hours}h ${mins}m`;
}

/**
 * احصل على لون الحالة
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'waiting':
      return 'bg-primary-500';
    case 'calling':
      return 'bg-accent-500';
    case 'active':
      return 'bg-purple-500';
    case 'done':
      return 'bg-green-500';
    default:
      return 'bg-neutral-500';
  }
}

/**
 * احصل على رسالة الحالة
 */
export function getStatusMessage(status: string): string {
  switch (status) {
    case 'waiting':
      return 'في الانتظار';
    case 'calling':
      return 'قيد الاستدعاء';
    case 'active':
      return 'قيد الاستشارة';
    case 'done':
      return 'انتهى';
    default:
      return status;
  }
}

/**
 * احصل على ترتيب المريض في الطابور
 */
export function getPatientRank(patients: QueueItem[], targetId: string): number {
  const index = patients.findIndex((p) => p.id === targetId);
  return index + 1;
}

/**
 * احصل على عدد المرضى في وضع معين
 */
export function getCountByStatus(patients: QueueItem[], status: string): number {
  return patients.filter((p) => p.status === status).length;
}

/**
 * احصل على إحصائيات شاملة
 */
export function getQueueStats(patients: QueueItem[]) {
  return {
    total: patients.length,
    waiting: getCountByStatus(patients, 'waiting'),
    calling: getCountByStatus(patients, 'calling'),
    active: getCountByStatus(patients, 'active'),
    done: getCountByStatus(patients, 'done'),
    avgWaitTime: Math.round(
      patients.reduce((acc, p) => {
        if (p.status === 'done' && p.completed_at && p.created_at) {
          const time =
            new Date(p.completed_at).getTime() - new Date(p.created_at).getTime();
          return acc + time / (1000 * 60);
        }
        return acc;
      }, 0) / Math.max(getCountByStatus(patients, 'done'), 1)
    ),
  };
}
