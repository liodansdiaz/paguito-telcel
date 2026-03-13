/**
 * Validadores para formularios
 * Incluye validaciones específicas para México (CURP, teléfono, RFC, etc.)
 */

// ══════════════════════════════════════════════════════════════════════════════
// CURP (Clave Única de Registro de Población)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Formato oficial de CURP:
 * - 4 letras: Apellido paterno (1), Apellido materno (1), Nombre (2)
 * - 6 dígitos: Fecha de nacimiento AAMMDD
 * - 1 letra: Sexo (H/M)
 * - 2 letras: Estado de nacimiento
 * - 3 letras: Primera consonante interna de apellidos y nombre
 * - 1 alfanumérico: Homoclave
 * - 1 dígito: Dígito verificador
 * 
 * Ejemplo: DIAZ901215HCSRZL09
 */
export const CURP_REGEX = /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$/;

/**
 * Valida el formato de un CURP
 */
export const isValidCURP = (curp: string): boolean => {
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
};

/**
 * Limpia y formatea un CURP (convierte a mayúsculas, elimina espacios)
 */
export const formatCURP = (curp: string): string => {
  return curp.trim().toUpperCase().replace(/\s+/g, '');
};

/**
 * Extrae información de un CURP válido
 */
export const parseCURP = (curp: string): {
  isValid: boolean;
  birthDate?: Date;
  sex?: 'H' | 'M';
  state?: string;
} => {
  const cleaned = formatCURP(curp);
  
  if (!isValidCURP(cleaned)) {
    return { isValid: false };
  }
  
  const year = parseInt(cleaned.substring(4, 6), 10);
  const month = parseInt(cleaned.substring(6, 8), 10);
  const day = parseInt(cleaned.substring(8, 10), 10);
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;
  
  return {
    isValid: true,
    birthDate: new Date(fullYear, month - 1, day),
    sex: cleaned.charAt(10) as 'H' | 'M',
    state: cleaned.substring(11, 13),
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// TELÉFONO MEXICANO
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Formatos válidos de teléfono en México:
 * - 10 dígitos: 9621234567 (celular o fijo con lada)
 * - Con código de país: +52 962 123 4567
 * - Con guiones: 962-123-4567
 * - Con espacios: 962 123 4567
 * - Con paréntesis: (962) 123-4567
 */
export const PHONE_MEXICO_REGEX = /^(\+?52)?[ -]?(\d{3})[ -]?(\d{3})[ -]?(\d{4})$/;

/**
 * Regex más estricto solo para 10 dígitos
 */
export const PHONE_10_DIGITS_REGEX = /^[1-9]\d{9}$/;

/**
 * Valida un teléfono mexicano
 */
export const isValidPhoneMX = (phone: string): boolean => {
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
};

/**
 * Formatea un teléfono mexicano a formato estándar
 * Ejemplo: 9621234567 -> (962) 123-4567
 */
export const formatPhoneMX = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Si tiene código de país, removerlo
  const withoutCountryCode = cleaned.startsWith('52') && cleaned.length === 12
    ? cleaned.substring(2)
    : cleaned;
  
  if (withoutCountryCode.length !== 10) {
    return phone; // Retornar original si no es válido
  }
  
  // Formato: (XXX) XXX-XXXX
  return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
};

/**
 * Limpia un teléfono para guardarlo en BD (solo dígitos)
 */
export const cleanPhoneMX = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Si tiene código de país, removerlo
  const withoutCountryCode = cleaned.startsWith('52') && cleaned.length === 12
    ? cleaned.substring(2)
    : cleaned;
  
  return withoutCountryCode;
};

/**
 * Valida que sea un celular (inicia con 1-9, no con 01 o 044/045)
 */
export const isMobilePhoneMX = (phone: string): boolean => {
  const cleaned = cleanPhoneMX(phone);
  
  if (cleaned.length !== 10) {
    return false;
  }
  
  // Los celulares en México inician con 1-9
  // Los fijos pueden iniciar con cualquier dígito dependiendo de la región
  const firstDigit = parseInt(cleaned.charAt(0), 10);
  return firstDigit >= 1 && firstDigit <= 9;
};

// ══════════════════════════════════════════════════════════════════════════════
// RFC (Registro Federal de Contribuyentes)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Formato de RFC:
 * - Persona física: 13 caracteres (4 letras + 6 dígitos + 3 alfanuméricos)
 * - Persona moral: 12 caracteres (3 letras + 6 dígitos + 3 alfanuméricos)
 * 
 * Ejemplo: DIAZ901215AB1
 */
export const RFC_PERSONA_FISICA_REGEX = /^[A-ZÑ&]{4}[0-9]{6}[A-Z0-9]{3}$/;
export const RFC_PERSONA_MORAL_REGEX = /^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/;

/**
 * Valida un RFC (persona física o moral)
 */
export const isValidRFC = (rfc: string): boolean => {
  if (!rfc) return false;
  const cleaned = rfc.trim().toUpperCase();
  
  return RFC_PERSONA_FISICA_REGEX.test(cleaned) || RFC_PERSONA_MORAL_REGEX.test(cleaned);
};

/**
 * Formatea un RFC
 */
export const formatRFC = (rfc: string): string => {
  return rfc.trim().toUpperCase().replace(/\s+/g, '');
};

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Regex robusto para email
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Valida un email
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
};

// ══════════════════════════════════════════════════════════════════════════════
// CÓDIGO POSTAL (México)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Código postal mexicano: 5 dígitos
 */
export const POSTAL_CODE_REGEX = /^\d{5}$/;

/**
 * Valida un código postal mexicano
 */
export const isValidPostalCode = (postalCode: string): boolean => {
  if (!postalCode) return false;
  return POSTAL_CODE_REGEX.test(postalCode.trim());
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS PARA ZOD
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Mensajes de error personalizados en español
 */
export const validationMessages = {
  curp: {
    required: 'El CURP es requerido',
    invalid: 'El CURP no es válido. Debe tener 18 caracteres y cumplir con el formato oficial',
    length: 'El CURP debe tener exactamente 18 caracteres',
  },
  phone: {
    required: 'El teléfono es requerido',
    invalid: 'El teléfono no es válido. Debe tener 10 dígitos (ejemplo: 9621234567)',
    format: 'Formato inválido. Use 10 dígitos sin espacios ni guiones',
  },
  email: {
    required: 'El email es requerido',
    invalid: 'El email no es válido',
  },
  rfc: {
    required: 'El RFC es requerido',
    invalid: 'El RFC no es válido',
  },
  postalCode: {
    required: 'El código postal es requerido',
    invalid: 'El código postal debe tener 5 dígitos',
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT CONVENIENTE
// ══════════════════════════════════════════════════════════════════════════════

export const validators = {
  curp: {
    validate: isValidCURP,
    format: formatCURP,
    parse: parseCURP,
    regex: CURP_REGEX,
  },
  phone: {
    validate: isValidPhoneMX,
    format: formatPhoneMX,
    clean: cleanPhoneMX,
    isMobile: isMobilePhoneMX,
    regex: PHONE_MEXICO_REGEX,
  },
  rfc: {
    validate: isValidRFC,
    format: formatRFC,
  },
  email: {
    validate: isValidEmail,
    regex: EMAIL_REGEX,
  },
  postalCode: {
    validate: isValidPostalCode,
    regex: POSTAL_CODE_REGEX,
  },
};

export default validators;
