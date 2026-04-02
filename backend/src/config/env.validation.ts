import { logger } from '../shared/utils/logger';

/**
 * Configuración de validación de variables de entorno
 * Diferentes requisitos para desarrollo vs producción
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  requiredInProduction: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const ENV_VARS: EnvVarConfig[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    requiredInProduction: true,
    validator: (value) => value.startsWith('postgresql://'),
    errorMessage: 'DATABASE_URL debe ser una URL de PostgreSQL válida',
  },

  // JWT - CRÍTICO en producción
  {
    name: 'JWT_SECRET',
    required: true,
    requiredInProduction: true,
    validator: (value) => {
      // En producción, debe tener al menos 64 caracteres
      if (process.env.NODE_ENV === 'production') {
        return value.length >= 64 && !value.includes('fallback') && !value.includes('change');
      }
      return value.length >= 32;
    },
    errorMessage: 'JWT_SECRET debe tener al menos 64 caracteres en producción y no contener "fallback" o "change"',
  },
  {
    name: 'JWT_REFRESH_SECRET',
    required: true,
    requiredInProduction: true,
    validator: (value) => {
      if (process.env.NODE_ENV === 'production') {
        return value.length >= 64 && !value.includes('fallback') && !value.includes('change');
      }
      return value.length >= 32;
    },
    errorMessage: 'JWT_REFRESH_SECRET debe tener al menos 64 caracteres en producción y no contener "fallback" o "change"',
  },
  {
    name: 'JWT_EXPIRES_IN',
    required: false,
    requiredInProduction: false,
  },
  {
    name: 'JWT_REFRESH_EXPIRES_IN',
    required: false,
    requiredInProduction: false,
  },

  // Server
  {
    name: 'PORT',
    required: false,
    requiredInProduction: false,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0 && parseInt(value) < 65536,
    errorMessage: 'PORT debe ser un número entre 1 y 65535',
  },
  {
    name: 'NODE_ENV',
    required: false,
    requiredInProduction: true,
    validator: (value) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'NODE_ENV debe ser "development", "production" o "test"',
  },
  {
    name: 'FRONTEND_URL',
    required: true,
    requiredInProduction: true,
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    errorMessage: 'FRONTEND_URL debe ser una URL válida (http:// o https://)',
  },

  // Email - Requerido en producción si las notificaciones están activadas
  {
    name: 'SMTP_HOST',
    required: false,
    requiredInProduction: false, // Se valida condicionalmente
  },
  {
    name: 'SMTP_PORT',
    required: false,
    requiredInProduction: false,
    validator: (value) => !isNaN(parseInt(value)),
    errorMessage: 'SMTP_PORT debe ser un número',
  },
  {
    name: 'SMTP_USER',
    required: false,
    requiredInProduction: false,
  },
  {
    name: 'SMTP_PASS',
    required: false,
    requiredInProduction: false,
  },
  {
    name: 'EMAIL_FROM',
    required: false,
    requiredInProduction: false,
  },

  // Notificaciones
  {
    name: 'NOTIFICATIONS_EMAIL',
    required: false,
    requiredInProduction: false,
    validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
    errorMessage: 'NOTIFICATIONS_EMAIL debe ser "true" o "false"',
  },
  {
    name: 'NOTIFICATIONS_WHATSAPP',
    required: false,
    requiredInProduction: false,
    validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
    errorMessage: 'NOTIFICATIONS_WHATSAPP debe ser "true" o "false"',
  },
  {
    name: 'NOTIFICATIONS_INTERNAL',
    required: false,
    requiredInProduction: false,
    validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
    errorMessage: 'NOTIFICATIONS_INTERNAL debe ser "true" o "false"',
  },

  // Evolution API (WhatsApp)
  {
    name: 'EVOLUTION_API_URL',
    required: false,
    requiredInProduction: false,
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    errorMessage: 'EVOLUTION_API_URL debe ser una URL válida (http:// o https://)',
  },
  {
    name: 'EVOLUTION_API_KEY',
    required: false,
    requiredInProduction: false,
  },
  {
    name: 'EVOLUTION_INSTANCE_NAME',
    required: false,
    requiredInProduction: false,
  },

  // Groq AI (opcional)
  {
    name: 'GROQ_API_KEY',
    required: false,
    requiredInProduction: false,
  },

  // Redis
  {
    name: 'REDIS_ENABLED',
    required: false,
    requiredInProduction: false,
    validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
    errorMessage: 'REDIS_ENABLED debe ser "true" o "false"',
  },
  {
    name: 'REDIS_HOST',
    required: false,
    requiredInProduction: false,
  },
  {
    name: 'REDIS_PORT',
    required: false,
    requiredInProduction: false,
    validator: (value) => !isNaN(parseInt(value)),
    errorMessage: 'REDIS_PORT debe ser un número',
  },
  {
    name: 'REDIS_PASSWORD',
    required: false,
    requiredInProduction: false, // Solo requerido si REDIS_ENABLED=true
    validator: (value) => {
      if (process.env.NODE_ENV === 'production') {
        return value.length >= 16;
      }
      return true;
    },
    errorMessage: 'REDIS_PASSWORD debe tener al menos 16 caracteres en producción',
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida todas las variables de entorno según la configuración
 */
export const validateEnv = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const config of ENV_VARS) {
    const value = process.env[config.name];
    const isRequired = isProduction ? config.requiredInProduction : config.required;

    // Verificar si la variable existe
    if (!value || value.trim() === '') {
      if (isRequired) {
        errors.push(`❌ Variable de entorno requerida faltante: ${config.name}`);
      }
      continue;
    }

    // Validar el valor si hay un validador
    if (config.validator && !config.validator(value)) {
      errors.push(`❌ ${config.name}: ${config.errorMessage || 'Valor inválido'}`);
    }
  }

  // Validaciones condicionales

  // Si las notificaciones por email están activadas, validar credenciales SMTP
  if (process.env.NOTIFICATIONS_EMAIL === 'true') {
    const requiredEmailVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
    for (const varName of requiredEmailVars) {
      if (!process.env[varName]) {
        errors.push(`❌ ${varName} es requerido cuando NOTIFICATIONS_EMAIL está activado`);
      }
    }
  }

  // Si las notificaciones por WhatsApp están activadas, validar Evolution API
  if (process.env.NOTIFICATIONS_WHATSAPP === 'true') {
    const requiredWhatsAppVars = ['EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCE_NAME'];
    for (const varName of requiredWhatsAppVars) {
      if (!process.env[varName]) {
        errors.push(`❌ ${varName} es requerido cuando NOTIFICATIONS_WHATSAPP está activado`);
      }
    }
  }

  // Validar DAILY_SUMMARY_HOUR si está definido
  if (process.env.DAILY_SUMMARY_HOUR !== undefined) {
    const hour = parseInt(process.env.DAILY_SUMMARY_HOUR, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      errors.push('❌ DAILY_SUMMARY_HOUR debe ser un entero entre 0 y 23');
    }
  }

  // Advertencias de seguridad
  if (isProduction) {
    // Verificar que los secrets no contengan valores por defecto peligrosos
    const dangerousPatterns = ['fallback', 'change_in_production', 'example', 'test', 'demo'];
    const secretVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    
    for (const secretVar of secretVars) {
      const value = process.env[secretVar]?.toLowerCase() || '';
      for (const pattern of dangerousPatterns) {
        if (value.includes(pattern)) {
          errors.push(`❌ ${secretVar} contiene un patrón peligroso: "${pattern}". Genera un nuevo secret con: npm run generate-secrets`);
        }
      }
    }

    // Verificar que FRONTEND_URL use HTTPS en producción
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.startsWith('https://')) {
      warnings.push(`⚠️  FRONTEND_URL debería usar HTTPS en producción`);
    }

    // Verificar que Redis tenga password en producción
    if (process.env.REDIS_ENABLED === 'true' && !process.env.REDIS_PASSWORD) {
      errors.push(`❌ REDIS_PASSWORD es requerido cuando Redis está habilitado en producción`);
    }
  } else {
    // Warnings para desarrollo
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      warnings.push(`⚠️  JWT_SECRET debería tener al menos 32 caracteres, incluso en desarrollo`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Valida las variables de entorno y lanza error si hay problemas críticos
 * Debe llamarse al inicio de la aplicación
 */
export const validateEnvOrExit = (): void => {
  const result = validateEnv();

  // Mostrar warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Advertencias de configuración:\n');
    result.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  // Si hay errores, mostrar y salir
  if (!result.valid) {
    console.error('\n❌ Error: Configuración de variables de entorno inválida\n');
    result.errors.forEach(error => console.error(`   ${error}`));
    console.error('\n📖 Consulta el archivo .env.example para ver las variables requeridas');
    console.error('🔐 Ejecuta "npm run generate-secrets" para generar secrets seguros\n');
    
    if (logger) {
      logger.error('Validación de variables de entorno falló', { errors: result.errors });
    }
    
    process.exit(1);
  }

  // Todo OK
  const envName = process.env.NODE_ENV || 'development';
  console.log(`✅ Variables de entorno validadas correctamente (${envName})\n`);
  
  if (logger) {
    logger.info('Variables de entorno validadas', { 
      environment: envName,
      warnings: result.warnings.length 
    });
  }
};

/**
 * Obtiene un resumen de la configuración actual (sin exponer valores sensibles)
 */
export const getEnvSummary = () => {
  return {
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? '✓ Configurado' : '✗ No configurado',
    jwt: {
      secret: process.env.JWT_SECRET ? `✓ (${process.env.JWT_SECRET.length} chars)` : '✗ No configurado',
      refreshSecret: process.env.JWT_REFRESH_SECRET ? `✓ (${process.env.JWT_REFRESH_SECRET.length} chars)` : '✗ No configurado',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m (default)',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d (default)',
    },
    server: {
      port: process.env.PORT || '3000 (default)',
      frontendUrl: process.env.FRONTEND_URL || '✗ No configurado',
    },
    email: {
      enabled: process.env.NOTIFICATIONS_EMAIL === 'true',
      host: process.env.SMTP_HOST || '✗ No configurado',
    },
    whatsapp: {
      enabled: process.env.NOTIFICATIONS_WHATSAPP === 'true',
      apiUrl: process.env.EVOLUTION_API_URL || '✗ No configurado',
      instanceName: process.env.EVOLUTION_INSTANCE_NAME || '✗ No configurado',
    },
    redis: {
      enabled: process.env.REDIS_ENABLED !== 'false',
      host: process.env.REDIS_HOST || 'localhost',
      hasPassword: !!process.env.REDIS_PASSWORD,
    },
    groq: {
      configured: !!process.env.GROQ_API_KEY,
    },
  };
};
