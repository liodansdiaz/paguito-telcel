/**
 * Generador de fingerprint del navegador
 * 
 * Crea un identificador único basado en características del navegador
 * que persiste aunque cambien de IP o red.
 * 
 * NO es 100% único (colisiones posibles), pero suficiente para rate limiting.
 */

const FINGERPRINT_KEY = 'paguito-chat-fingerprint';

/**
 * Genera un hash simple (no criptográfico, solo para identificación)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Obtiene información del navegador para crear el fingerprint
 */
function getBrowserInfo(): string {
  const components = [
    navigator.userAgent || 'unknown',
    navigator.language || 'unknown',
    screen.colorDepth || 0,
    screen.width || 0,
    screen.height || 0,
    new Date().getTimezoneOffset() || 0,
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
  ];

  return components.join('|');
}

/**
 * Genera o recupera el fingerprint del navegador
 * 
 * Se guarda en localStorage para mantener consistencia
 * (si borran localStorage, se genera uno nuevo)
 */
export function getFingerprint(): string {
  // Intentar recuperar fingerprint existente
  const stored = localStorage.getItem(FINGERPRINT_KEY);
  if (stored) {
    return stored;
  }

  // Generar nuevo fingerprint
  const browserInfo = getBrowserInfo();
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  
  const fingerprint = `fp_${simpleHash(browserInfo)}_${timestamp}_${random}`;
  
  // Guardar en localStorage
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  
  return fingerprint;
}

/**
 * Resetea el fingerprint (útil para testing)
 */
export function resetFingerprint(): void {
  localStorage.removeItem(FINGERPRINT_KEY);
}
