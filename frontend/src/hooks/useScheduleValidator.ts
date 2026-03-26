export interface ScheduleValidation {
  isValid: boolean;
  message?: string;
}

export const validateSchedule = (date: string, time: string): ScheduleValidation => {
  if (!date || !time) return { isValid: false, message: 'Selecciona fecha y horario.' };

  // Usar mediodía UTC para evitar problemas de zona horaria
  const selectedDate = new Date(date + 'T12:00:00Z');
  const dayOfWeek = selectedDate.getUTCDay(); // 0=Dom, 1=Lun...6=Sáb

  if (dayOfWeek === 0) {
    return { isValid: false, message: 'No hay servicio los domingos. Selecciona otro día.' };
  }

  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const totalMinutes = hour * 60 + minute;

  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    const min = 9 * 60 + 30; // 9:30 = 570
    const max = 16 * 60 + 30; // 16:30 = 990
    if (totalMinutes < min || totalMinutes > max) {
      return { isValid: false, message: 'Lunes a viernes el horario disponible es de 9:30 AM a 4:30 PM.' };
    }
  } else if (dayOfWeek === 6) {
    const min = 9 * 60 + 30;  // 9:30 = 570
    const max = 14 * 60 + 30; // 14:30 = 870
    if (totalMinutes < min || totalMinutes > max) {
      return { isValid: false, message: 'Los sábados el horario disponible es de 9:30 AM a 2:30 PM.' };
    }
  }

  return { isValid: true };
};

export const getMinTime = (date: string): string => {
  if (!date) return '09:30';
  const day = new Date(date + 'T12:00:00Z').getUTCDay();
  return day === 0 ? '09:30' : '09:30';
};

export const getMaxTime = (date: string): string => {
  if (!date) return '16:30';
  const day = new Date(date + 'T12:00:00Z').getUTCDay();
  if (day === 6) return '14:30';
  if (day === 0) return '16:30';
  return '16:30';
};
