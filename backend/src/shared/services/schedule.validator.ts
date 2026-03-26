import { AppError } from '../middleware/error.middleware';

export interface HorarioValidation {
  isValid: boolean;
  message?: string;
}

/**
 * Valida que el horario preferido sea válido según las reglas de negocio:
 * - Lunes a Viernes: 09:30 - 16:30
 * - Sábados: 09:30 - 14:30
 * - Domingos: No disponible
 */
export class ScheduleValidatorService {
  private static readonly MIN_HOUR_WEEKDAY = 9;
  private static readonly MIN_MINUTE_WEEKDAY = 30;
  private static readonly MAX_HOUR_WEEKDAY = 16;
  private static readonly MAX_MINUTE_WEEKDAY = 30;

  private static readonly MIN_HOUR_SATURDAY = 9;
  private static readonly MIN_MINUTE_SATURDAY = 30;
  private static readonly MAX_HOUR_SATURDAY = 14;
  private static readonly MAX_MINUTE_SATURDAY = 30;

  /**
   * Valida fecha y horario combinados.
   * fechaPreferida: ISO string o Date
   * horarioPreferido: string tipo "10:00", "14:30"
   */
  static validate(fechaPreferida: Date, horarioPreferido: string): HorarioValidation {
    const date = new Date(fechaPreferida);
    const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb

    if (dayOfWeek === 0) {
      return {
        isValid: false,
        message: 'No hay servicio los domingos. Por favor selecciona otro día.',
      };
    }

    const timeParts = horarioPreferido.match(/^(\d|1\d|2[0-3]):([0-5]\d)$/);
    if (!timeParts) {
      return {
        isValid: false,
        message: 'Formato de horario inválido. Use HH:MM (ej: 10:30)',
      };
    }

    const hour = parseInt(timeParts[1], 10);
    const minute = parseInt(timeParts[2], 10);
    const totalMinutes = hour * 60 + minute;

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Lunes a Viernes
      const minMinutes = this.MIN_HOUR_WEEKDAY * 60 + this.MIN_MINUTE_WEEKDAY; // 570
      const maxMinutes = this.MAX_HOUR_WEEKDAY * 60 + this.MAX_MINUTE_WEEKDAY; // 990

      if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
        return {
          isValid: false,
          message: 'El horario de lunes a viernes es de 9:30 AM a 4:30 PM.',
        };
      }
    } else if (dayOfWeek === 6) {
      // Sábado
      const minMinutes = this.MIN_HOUR_SATURDAY * 60 + this.MIN_MINUTE_SATURDAY; // 570
      const maxMinutes = this.MAX_HOUR_SATURDAY * 60 + this.MAX_MINUTE_SATURDAY; // 870

      if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
        return {
          isValid: false,
          message: 'El horario de sábados es de 9:30 AM a 2:30 PM.',
        };
      }
    }

    return { isValid: true };
  }

  static validateOrThrow(fechaPreferida: Date, horarioPreferido: string): void {
    const result = this.validate(fechaPreferida, horarioPreferido);
    if (!result.isValid) {
      throw new AppError(result.message || 'Horario no válido', 422);
    }
  }
}
