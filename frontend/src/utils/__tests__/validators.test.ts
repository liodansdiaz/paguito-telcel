import { describe, it, expect } from 'vitest';
import {
  isValidCURP,
  formatCURP,
  parseCURP,
  isValidPhoneMX,
  formatPhoneMX,
  cleanPhoneMX,
  isValidRFC,
  isValidEmail,
  isValidPostalCode,
} from '../validators';

describe('isValidCURP', () => {
  it('valida CURP correcto (18 caracteres, formato válido)', () => {
    expect(isValidCURP('DIAZ901215HCSRZL09')).toBe(true);
  });

  it('rechaza CURP inválido', () => {
    expect(isValidCURP('XXXX000000XXXXXX00')).toBe(false);
  });

  it('rechaza string vacío', () => {
    expect(isValidCURP('')).toBe(false);
  });
});

describe('formatCURP', () => {
  it('convierte a mayúsculas y elimina espacios', () => {
    expect(formatCURP('  diaz901215hcsrzl09  ')).toBe('DIAZ901215HCSRZL09');
    expect(formatCURP('DIAZ 901215 HCSRZL09')).toBe('DIAZ901215HCSRZL09');
  });
});

describe('parseCURP', () => {
  it('extrae fecha de nacimiento, sexo y estado', () => {
    const result = parseCURP('DIAZ901215HCSRZL09');
    expect(result.isValid).toBe(true);
    expect(result.birthDate).toEqual(new Date(1990, 11, 15));
    expect(result.sex).toBe('H');
    expect(result.state).toBe('CS');
  });

  it('retorna isValid false para CURP inválido', () => {
    const result = parseCURP('INVALID');
    expect(result.isValid).toBe(false);
  });
});

describe('isValidPhoneMX', () => {
  it('valida teléfono de 10 dígitos', () => {
    expect(isValidPhoneMX('9621234567')).toBe(true);
  });

  it('valida teléfono con código de país +52', () => {
    expect(isValidPhoneMX('+529621234567')).toBe(true);
  });

  it('rechaza teléfono inválido', () => {
    expect(isValidPhoneMX('123')).toBe(false);
    expect(isValidPhoneMX('')).toBe(false);
  });
});

describe('formatPhoneMX', () => {
  it('formatea a (XXX) XXX-XXXX', () => {
    expect(formatPhoneMX('9621234567')).toBe('(962) 123-4567');
  });
});

describe('cleanPhoneMX', () => {
  it('elimina todo excepto dígitos', () => {
    expect(cleanPhoneMX('(962) 123-4567')).toBe('9621234567');
    expect(cleanPhoneMX('962-123-4567')).toBe('9621234567');
  });

  it('remueve código de país 52', () => {
    expect(cleanPhoneMX('529621234567')).toBe('9621234567');
  });
});

describe('isValidRFC', () => {
  it('valida RFC persona física (13 caracteres)', () => {
    expect(isValidRFC('DIAZ901215AB1')).toBe(true);
  });

  it('valida RFC persona moral (12 caracteres)', () => {
    expect(isValidRFC('ABC010101XYZ')).toBe(true);
  });

  it('rechaza RFC inválido', () => {
    expect(isValidRFC('INVALID')).toBe(false);
    expect(isValidRFC('')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('valida email correcto', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('rechaza email sin @', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
  });

  it('rechaza email sin dominio', () => {
    expect(isValidEmail('test@')).toBe(false);
  });
});

describe('isValidPostalCode', () => {
  it('valida código de 5 dígitos', () => {
    expect(isValidPostalCode('06600')).toBe(true);
    expect(isValidPostalCode('96200')).toBe(true);
  });

  it('rechaza código inválido', () => {
    expect(isValidPostalCode('123')).toBe(false);
    expect(isValidPostalCode('123456')).toBe(false);
    expect(isValidPostalCode('')).toBe(false);
  });
});
