import { describe, it, expect } from 'vitest';
import { getColorHex } from '../colors';

describe('getColorHex', () => {
  it('retorna hex para "negro"', () => {
    expect(getColorHex('negro')).toBe('#1a1a1a');
  });

  it('retorna hex para "blanco"', () => {
    expect(getColorHex('blanco')).toBe('#f5f5f5');
  });

  it('retorna hex para "azul"', () => {
    expect(getColorHex('azul')).toBe('#2563eb');
  });

  it('retorna hex para "rojo"', () => {
    expect(getColorHex('rojo')).toBe('#dc2626');
  });

  it('retorna fallback para color desconocido', () => {
    expect(getColorHex('magenta')).toBe('#9ca3af');
  });

  it('es case-insensitive ("NEGRO" funciona)', () => {
    expect(getColorHex('NEGRO')).toBe('#1a1a1a');
    expect(getColorHex('Azul')).toBe('#2563eb');
    expect(getColorHex('ROJO')).toBe('#dc2626');
  });
});
