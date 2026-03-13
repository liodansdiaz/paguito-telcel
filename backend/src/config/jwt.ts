/**
 * Configuración de JWT
 * 
 * IMPORTANTE: Las variables JWT_SECRET y JWT_REFRESH_SECRET son REQUERIDAS.
 * No hay valores por defecto por razones de seguridad.
 * 
 * Para generar secrets seguros, ejecuta: npm run generate-secrets
 */

if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET no está definido. Ejecuta "npm run generate-secrets" para generar uno seguro.'
  );
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error(
    'JWT_REFRESH_SECRET no está definido. Ejecuta "npm run generate-secrets" para generar uno seguro.'
  );
}

// En producción, validar longitud mínima
if (process.env.NODE_ENV === 'production') {
  if (process.env.JWT_SECRET.length < 64) {
    throw new Error(
      'JWT_SECRET debe tener al menos 64 caracteres en producción. Ejecuta "npm run generate-secrets".'
    );
  }
  
  if (process.env.JWT_REFRESH_SECRET.length < 64) {
    throw new Error(
      'JWT_REFRESH_SECRET debe tener al menos 64 caracteres en producción. Ejecuta "npm run generate-secrets".'
    );
  }
}

export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
