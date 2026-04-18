import 'dotenv/config';

// ⚠️ CRÍTICO: Validar variables de entorno ANTES de importar cualquier otro módulo
import { validateEnvOrExit, getEnvSummary } from './config/env.validation';
validateEnvOrExit();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cron from 'node-cron';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { logger } from './shared/utils/logger';
import { DailySummaryService } from './shared/services/daily-summary.service';
import { startSummaryScheduler } from './shared/services/summary-scheduler.service';
import authRoutes from './modules/auth/auth.routes';
import productRoutes from './modules/products/product.routes';
import customerRoutes from './modules/customers/customer.routes';
import reservationRoutes from './modules/reservations/reservation.routes';
import userRoutes from './modules/users/user.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import chatRoutes from './modules/chat/chat.routes';
import adminLogsRoutes from './modules/admin/admin.logs.routes';
import adminNotificationsRoutes from './modules/admin/admin.notifications.routes';
import adminChatConfigRoutes from './modules/admin/admin.chat-config.routes';
import adminChatMetricsRoutes from './modules/admin/admin.chat-metrics.routes';
import systemConfigRoutes from './modules/system-config/system-config.routes';
import { prisma } from './config/database';
import fs from 'fs';
import path from 'path';

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Crear directorio de uploads si no existe
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Orígenes permitidos: el frontend configurado + localhost en desarrollo
const allowedOrigins: string[] = [FRONTEND_URL];
if (process.env.NODE_ENV !== 'production') {
  // En desarrollo permitir cualquier puerto de localhost
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
  );
}

// Servir imágenes estáticas
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Comprimir todas las respuestas HTTP
app.use(compression());

// Middlewares globales
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite que el frontend cargue las imágenes
}));
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requests sin origin (herramientas como Postman, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido → ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: (msg: string) => logger.info(msg.trim()) },
}));

// Health check básico
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Paguito Telcel API' });
});

// Health check detallado (solo en desarrollo)
app.get('/health/detailed', async (req, res) => {
  // Proteger en producción - requiere header secreto
  if (process.env.NODE_ENV === 'production') {
    const healthToken = req.headers['x-health-token'];
    if (!healthToken || healthToken !== process.env.HEALTH_CHECK_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    // Check database
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Paguito Telcel API',
      environment: getEnvSummary(),
      checks: {
        database: {
          status: 'healthy',
          latency: `${dbLatency}ms`,
        },
        uptime: `${Math.floor(process.uptime())}s`,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
      },
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service degraded',
    });
  }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/customers', customerRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin/logs', adminLogsRoutes);
app.use('/api/admin/notifications', adminNotificationsRoutes);
app.use('/api/admin/chat-config', adminChatConfigRoutes);
app.use('/api/admin/chat-metrics', adminChatMetricsRoutes);
app.use('/api/admin/config', systemConfigRoutes);

// Ruta 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Middleware de errores global (debe ser el último)
app.use(errorMiddleware);

// Iniciar servidor
const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Conexión a la base de datos establecida');

    app.listen(PORT, () => {
      logger.info(`Servidor corriendo en http://localhost:${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

    // Iniciar scheduler del resumen diario
    await startSummaryScheduler();

    // Graceful shutdown: cerrar conexiones limpiamente al recibir señales
    const shutdown = async (signal: string) => {
      logger.info(`${signal} recibido. Cerrando servidor...`);
      try {
        await prisma.$disconnect();
        logger.info('Conexión a base de datos cerrada');
        process.exit(0);
      } catch (err) {
        logger.error('Error durante shutdown:', err);
        process.exit(1);
      }
      // Forzar cierre después de 10 segundos si algo se cuelga
      setTimeout(() => {
        logger.warn('Shutdown forzado después de timeout');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
