/**
 * Validadores para datos mexicanos (CURP, Teléfono, RFC, etc.)
 */

// ══════════════════════════════════════════════════════════════════════════════
// CURP (Clave Única de Registro de Población)
// ══════════════════════════════════════════════════════════════════════════════

export const CURP_REGEX = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$/;

export function isValidCURP(curp: string): boolean {
  if (!curp) return false;
  const cleaned = curp.trim().toUpperCase();
  
  if (!CURP_REGEX.test(cleaned)) {
    return false;
  }
  
  // Validar fecha de nacimiento
  const year = parseInt(cleaned.substring(4, 6), 10);
  const month = parseInt(cleaned.substring(6, 8), 10);
  const day = parseInt(cleaned.substring(8, 10), 10);
  
  // Ajustar año (asumiendo que 00-30 es 2000-2030, 31-99 es 1931-1999)
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;
  
  // Validar que la fecha sea válida
  const date = new Date(fullYear, month - 1, day);
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }
  
  return true;
}

export function formatCURP(curp: string): string {
  return curp.trim().toUpperCase().replace(/\s+/g, '');
}

// ══════════════════════════════════════════════════════════════════════════════
// TELÉFONO MEXICANO
// ══════════════════════════════════════════════════════════════════════════════

export const PHONE_10_DIGITS_REGEX = /^[1-9]\d{9}$/;

export function isValidPhoneMX(phone: string): boolean {
  if (!phone) return false;
  
  // Limpiar el teléfono de espacios, guiones, paréntesis
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Si empieza con +52, removerlo
  const withoutCountryCode = cleaned.startsWith('+52') 
    ? cleaned.substring(3) 
    : cleaned.startsWith('52') && cleaned.length === 12
    ? cleaned.substring(2)
    : cleaned;
  
  // Debe tener exactamente 10 dígitos y no empezar con 0
  return PHONE_10_DIGITS_REGEX.test(withoutCountryCode);
}

export function cleanPhoneMX(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // Si tiene código de país, removerlo
  const withoutCountryCode = cleaned.startsWith('52') && cleaned.length === 12
    ? cleaned.substring(2)
    : cleaned;
  
  return withoutCountryCode;
}

// ══════════════════════════════════════════════════════════════════════════════
// RFC (Registro Federal de Contribuyentes)
// ══════════════════════════════════════════════════════════════════════════════

export const RFC_PERSONA_FISICA_REGEX = /^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$/;
export const RFC_PERSONA_MORAL_REGEX = /^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/;

export function isValidRFC(rfc: string): boolean {
  if (!rfc) return false;
  const cleaned = rfc.trim().toUpperCase();
  
  return RFC_PERSONA_FISICA_REGEX.test(cleaned) || RFC_PERSONA_MORAL_REGEX.test(cleaned);
}

export function formatRFC(rfc: string): string {
  return rfc.trim().toUpperCase().replace(/\s+/g, '');
}

// ══════════════════════════════════════════════════════════════════════════════
// MENSAJES DE ERROR
// ══════════════════════════════════════════════════════════════════════════════

export const validationMessages = {
  curp: {
    required: 'El CURP es requerido',
    invalid: 'El CURP no es válido. Debe tener 18 caracteres y cumplir con el formato oficial',
    length: 'El CURP debe tener exactamente 18 caracteres',
  },
  phone: {
    required: 'El teléfono es requerido',
    invalid: 'El teléfono no es válido. Debe tener 10 dígitos (ejemplo: 9621234567)',
  },
  rfc: {
    required: 'El RFC es requerido',
    invalid: 'El RFC no es válido',
  },
};
