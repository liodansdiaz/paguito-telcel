import 'dotenv/config';

// ⚠️ CRÍTICO: Validar variables de entorno ANTES de importar cualquier otro módulo
import { validateEnvOrExit, getEnvSummary } from './config/env.validation';
validateEnvOrExit();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { logger } from './shared/utils/logger';
import authRoutes from './modules/auth/auth.routes';
import productRoutes from './modules/products/product.routes';
import customerRoutes from './modules/customers/customer.routes';
import reservationRoutes from './modules/reservations/reservation.routes';
import userRoutes from './modules/users/user.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import chatRoutes from './modules/chat/chat.routes';
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
  // En desarrollo también se permite el puerto de Vite por defecto
  if (!allowedOrigins.includes('http://localhost:5173')) {
    allowedOrigins.push('http://localhost:5173');
  }
}

// Servir imágenes estáticas
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
