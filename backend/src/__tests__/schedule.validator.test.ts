import { describe, it, expect } from 'vitest';
import { ScheduleValidatorService } from '../shared/services/schedule.validator';

// Helper para construir una fecha con un día de semana específico
// Se usa una semana fija para evitar que los tests dependan del día actual.
// Semana de referencia: 2026-03-09 (lunes) a 2026-03-15 (domingo)
const makeDate = (dayOffset: number): Date => {
  // 2026-03-09 es lunes (dayOfWeek = 1)
  const base = new Date('2026-03-09T12:00:00.000Z');
  base.setDate(base.getDate() + dayOffset);
  return base;
};

const LUNES    = makeDate(0); // lunes
const MARTES   = makeDate(1);
const MIERCOLES = makeDate(2);
const JUEVES   = makeDate(3);
const VIERNES  = makeDate(4);
const SABADO   = makeDate(5);
const DOMINGO  = makeDate(6);

describe('ScheduleValidatorService', () => {

  // ── Domingos ────────────────────────────────────────────────────────────────
  describe('Domingos — siempre inválido', () => {
    it('rechaza cualquier horario en domingo', () => {
      const result = ScheduleValidatorService.validate(DOMINGO, '10:00');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('domingo');
    });

    it('rechaza incluso horario que sería válido en semana', () => {
      const result = ScheduleValidatorService.validate(DOMINGO, '12:00');
      expect(result.isValid).toBe(false);
    });
  });

  // ── Lunes a viernes ─────────────────────────────────────────────────────────
  describe('Lunes a viernes — 09:30 a 16:30', () => {
    it.each([LUNES, MARTES, MIERCOLES, JUEVES, VIERNES])(
      'acepta 09:30 en día %# de semana',
      (dia) => {
        expect(ScheduleValidatorService.validate(dia, '9:30').isValid).toBe(true);
      }
    );

    it.each([LUNES, MARTES, MIERCOLES, JUEVES, VIERNES])(
      'acepta 16:30 en día %# de semana',
      (dia) => {
        expect(ScheduleValidatorService.validate(dia, '16:30').isValid).toBe(true);
      }
    );

    it('acepta horario de mediodía (12:00) en lunes', () => {
      expect(ScheduleValidatorService.validate(LUNES, '12:00').isValid).toBe(true);
    });

    it('rechaza horario antes de las 9:30 (09:00) en lunes', () => {
      const result = ScheduleValidatorService.validate(LUNES, '9:00');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('9:30');
    });

    it('rechaza horario después de las 16:30 (17:00) en viernes', () => {
      const result = ScheduleValidatorService.validate(VIERNES, '17:00');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('4:30');
    });

    it('rechaza 00:00 en día de semana', () => {
      expect(ScheduleValidatorService.validate(LUNES, '0:00').isValid).toBe(false);
    });

    it('rechaza 23:59 en día de semana', () => {
      expect(ScheduleValidatorService.validate(MIERCOLES, '23:59').isValid).toBe(false);
    });
  });

  // ── Sábados ─────────────────────────────────────────────────────────────────
  describe('Sábados — 09:30 a 14:30', () => {
    it('acepta 09:30 en sábado', () => {
      expect(ScheduleValidatorService.validate(SABADO, '9:30').isValid).toBe(true);
    });

    it('acepta 14:30 en sábado', () => {
      expect(ScheduleValidatorService.validate(SABADO, '14:30').isValid).toBe(true);
    });

    it('acepta 12:00 en sábado', () => {
      expect(ScheduleValidatorService.validate(SABADO, '12:00').isValid).toBe(true);
    });

    it('rechaza 15:00 en sábado (fuera de horario)', () => {
      const result = ScheduleValidatorService.validate(SABADO, '15:00');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('2:30');
    });

    it('rechaza horario que sería válido en semana (16:00) en sábado', () => {
      expect(ScheduleValidatorService.validate(SABADO, '16:00').isValid).toBe(false);
    });

    it('rechaza 09:00 en sábado (antes del horario)', () => {
      expect(ScheduleValidatorService.validate(SABADO, '9:00').isValid).toBe(false);
    });
  });

  // ── Formatos inválidos ───────────────────────────────────────────────────────
  describe('Formato de horario inválido', () => {
    it.each(['abc', '10', '10:0', '10:000', '', '25:00', ':30'])(
      'rechaza formato inválido "%s"',
      (horario) => {
        const result = ScheduleValidatorService.validate(LUNES, horario);
        expect(result.isValid).toBe(false);
      }
    );
  });

  // ── validateOrThrow ──────────────────────────────────────────────────────────
  describe('validateOrThrow', () => {
    it('no lanza excepción para horario válido', () => {
      expect(() =>
        ScheduleValidatorService.validateOrThrow(LUNES, '10:00')
      ).not.toThrow();
    });

    it('lanza AppError con status 422 para horario inválido', () => {
      expect(() =>
        ScheduleValidatorService.validateOrThrow(DOMINGO, '10:00')
      ).toThrow();
    });

    it('lanza AppError con status 422 para sábado fuera de horario', () => {
      expect(() =>
        ScheduleValidatorService.validateOrThrow(SABADO, '15:00')
      ).toThrow();
    });
  });
});
