import { describe, it, expect } from 'vitest';
import { validateSchedule, getMinTime, getMaxTime } from '../useScheduleValidator';

describe('validateSchedule', () => {
  it('rechaza si falta fecha', () => {
    const result = validateSchedule('', '10:00');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Selecciona fecha y horario.');
  });

  it('rechaza si falta hora', () => {
    const result = validateSchedule('2026-03-30', '');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Selecciona fecha y horario.');
  });

  it('rechaza domingo', () => {
    const result = validateSchedule('2026-03-29', '10:00');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('No hay servicio los domingos. Selecciona otro día.');
  });

  it('acepta lunes 10:00', () => {
    const result = validateSchedule('2026-03-30', '10:00');
    expect(result.isValid).toBe(true);
  });

  it('rechaza lunes 18:00 (fuera de rango)', () => {
    const result = validateSchedule('2026-03-30', '18:00');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Lunes a viernes el horario disponible es de 9:30 AM a 4:30 PM.');
  });

  it('rechaza lunes 8:00 (antes de 9:30)', () => {
    const result = validateSchedule('2026-03-30', '08:00');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Lunes a viernes el horario disponible es de 9:30 AM a 4:30 PM.');
  });

  it('acepta sábado 10:00', () => {
    const result = validateSchedule('2026-03-28', '10:00');
    expect(result.isValid).toBe(true);
  });

  it('rechaza sábado 15:00 (después de 14:30)', () => {
    const result = validateSchedule('2026-03-28', '15:00');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Los sábados el horario disponible es de 9:30 AM a 2:30 PM.');
  });

  it('acepta viernes 16:30 (límite)', () => {
    const result = validateSchedule('2026-04-03', '16:30');
    expect(result.isValid).toBe(true);
  });
});

describe('getMinTime', () => {
  it('retorna 09:30 para lunes', () => {
    expect(getMinTime('2026-03-30')).toBe('09:30');
  });

  it('retorna 09:30 para domingo', () => {
    expect(getMinTime('2026-03-29')).toBe('09:30');
  });
});

describe('getMaxTime', () => {
  it('retorna 16:30 para lunes', () => {
    expect(getMaxTime('2026-03-30')).toBe('16:30');
  });

  it('retorna 14:30 para sábado', () => {
    expect(getMaxTime('2026-03-28')).toBe('14:30');
  });
});
