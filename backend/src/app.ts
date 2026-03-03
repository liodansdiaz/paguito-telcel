import 'dotenv/config';
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

// Servir imágenes estáticas
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Middlewares globales
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite que el frontend cargue las imágenes
}));
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Paguito Telcel API' });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/customers', customerRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
