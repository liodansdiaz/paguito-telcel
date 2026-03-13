#!/usr/bin/env ts-node

import 'dotenv/config';
import { validateEnv, getEnvSummary } from '../src/config/env.validation';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Script para validar la configuración de variables de entorno
 * Uso: npm run env:validate
 */

const validateEnvironment = () => {
  console.log('🔍 Validando configuración de variables de entorno...\n');

  // Verificar que existe el archivo .env
  const envPath = join(__dirname, '..', '.env');
  if (!existsSync(envPath)) {
    console.error('❌ Error: No se encontró el archivo .env\n');
    console.log('📝 Pasos para configurar:');
    console.log('   1. Copia .env.example a .env:');
    console.log('      cp .env.example .env\n');
    console.log('   2. Genera secrets seguros:');
    console.log('      npm run generate-secrets\n');
    console.log('   3. Copia los secrets generados al archivo .env\n');
    console.log('   4. Completa las demás variables según tu entorno\n');
    process.exit(1);
  }

  // Ejecutar validación
  const result = validateEnv();

  // Mostrar resumen de configuración
  console.log('📊 Resumen de configuración:\n');
  const summary = getEnvSummary();
  
  console.log(`   Ambiente: ${summary.environment}`);
  console.log(`   Base de datos: ${summary.database}`);
  console.log(`   JWT Secret: ${summary.jwt.secret}`);
  console.log(`   JWT Refresh Secret: ${summary.jwt.refreshSecret}`);
  console.log(`   JWT Expires In: ${summary.jwt.expiresIn}`);
  console.log(`   JWT Refresh Expires In: ${summary.jwt.refreshExpiresIn}`);
  console.log(`   Puerto: ${summary.server.port}`);
  console.log(`   Frontend URL: ${summary.server.frontendUrl}`);
  console.log(`   Email: ${summary.email.enabled ? '✓ Habilitado' : '✗ Deshabilitado'} (${summary.email.host})`);
  console.log(`   Redis: ${summary.redis.enabled ? '✓ Habilitado' : '✗ Deshabilitado'} (${summary.redis.host}${summary.redis.hasPassword ? ' con password' : ' sin password'})`);
  console.log(`   Groq AI: ${summary.groq.configured ? '✓ Configurado' : '✗ No configurado'}`);
  console.log('');

  // Mostrar advertencias
  if (result.warnings.length > 0) {
    console.log('⚠️  Advertencias:\n');
    result.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  // Mostrar errores
  if (!result.valid) {
    console.error('❌ Errores de validación:\n');
    result.errors.forEach(error => console.error(`   ${error}`));
    console.log('');
    console.log('📖 Soluciones:');
    console.log('   • Revisa el archivo .env.example para ver las variables requeridas');
    console.log('   • Ejecuta "npm run generate-secrets" para generar secrets seguros');
    console.log('   • Asegúrate de que todas las variables requeridas estén configuradas\n');
    process.exit(1);
  }

  // Todo OK
  console.log('✅ Configuración válida - ¡Todo listo para iniciar el servidor!\n');

  // Mostrar comandos útiles
  console.log('📚 Comandos útiles:');
  console.log('   npm run dev          - Iniciar servidor en modo desarrollo');
  console.log('   npm run build        - Compilar para producción');
  console.log('   npm start            - Iniciar servidor compilado');
  console.log('   npm run generate-secrets - Generar nuevos secrets\n');

  process.exit(0);
};

// Ejecutar
if (require.main === module) {
  validateEnvironment();
}
