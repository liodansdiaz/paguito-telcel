#!/usr/bin/env ts-node

import { randomBytes } from 'crypto';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Script para generar secrets criptográficamente seguros
 * Uso: npm run generate-secrets
 * 
 * Genera:
 * - JWT_SECRET
 * - JWT_REFRESH_SECRET
 * - REDIS_PASSWORD (opcional)
 */

const generateSecret = (length: number = 64): string => {
  return randomBytes(length).toString('base64');
};

const generateSecrets = () => {
  console.log('🔐 Generando secrets criptográficamente seguros...\n');

  const secrets = {
    JWT_SECRET: generateSecret(64),
    JWT_REFRESH_SECRET: generateSecret(64),
    REDIS_PASSWORD: generateSecret(32),
  };

  // Mostrar los secrets generados
  console.log('✅ Secrets generados exitosamente:\n');
  console.log('─'.repeat(80));
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}="${value}"`);
    console.log('─'.repeat(80));
  });

  console.log('\n📝 IMPORTANTE:');
  console.log('1. Copia estos valores a tu archivo .env');
  console.log('2. NUNCA compartas estos valores en Git o públicamente');
  console.log('3. Usa diferentes secrets para desarrollo y producción');
  console.log('4. Guarda estos valores en un gestor de contraseñas seguro\n');

  // Preguntar si quiere guardar en .env.secrets (para referencia, no para commitear)
  const envSecretsPath = join(__dirname, '..', '.env.secrets');
  
  if (existsSync(envSecretsPath)) {
    console.log('⚠️  Ya existe .env.secrets - no se sobrescribirá');
    console.log('   Si necesitas regenerar, elimina .env.secrets primero\n');
  } else {
    const content = `# Secrets generados el ${new Date().toISOString()}
# ⚠️ NO COMMITEAR ESTE ARCHIVO - Solo para referencia local
# Estos valores deben copiarse manualmente a .env

${Object.entries(secrets).map(([key, value]) => `${key}="${value}"`).join('\n')}
`;
    
    writeFileSync(envSecretsPath, content, 'utf-8');
    console.log(`✅ Secrets guardados en .env.secrets (solo para referencia)`);
    console.log(`   Recuerda agregar .env.secrets a .gitignore\n`);
  }

  // Verificar que .env.example no tenga secrets reales
  const envExamplePath = join(__dirname, '..', '.env.example');
  if (existsSync(envExamplePath)) {
    const envExampleContent = readFileSync(envExamplePath, 'utf-8');
    const hasRealSecrets = Object.values(secrets).some(secret => 
      envExampleContent.includes(secret)
    );
    
    if (hasRealSecrets) {
      console.log('⚠️  ADVERTENCIA: .env.example contiene secrets reales!');
      console.log('   Esto es un riesgo de seguridad.\n');
    }
  }

  console.log('🎯 Próximos pasos:');
  console.log('1. Copia los valores generados a tu archivo .env');
  console.log('2. Ejecuta: npm run env:validate');
  console.log('3. Reinicia el servidor\n');
};

// Ejecutar si se llama directamente
if (require.main === module) {
  generateSecrets();
}

export { generateSecret, generateSecrets };
