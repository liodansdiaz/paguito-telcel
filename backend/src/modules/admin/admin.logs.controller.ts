import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export class AdminLogsController {
  /**
   * Lista todos los archivos de log disponibles
   */
  async getLogFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const logsDir = path.join(process.cwd(), 'logs');

      if (!fs.existsSync(logsDir)) {
        return res.json({ files: [] });
      }

      const files = fs.readdirSync(logsDir)
        .filter(f => f.endsWith('.log') || f.endsWith('.log.gz'))
        .map(f => {
          const stats = fs.statSync(path.join(logsDir, f));
          const isGz = f.endsWith('.gz');
          return {
            name: f,
            size: stats.size,
            sizeFormatted: this.formatBytes(stats.size),
            date: this.extractDate(f),
            modified: stats.mtime.toISOString(),
            compressed: isGz,
          };
        })
        .sort((a, b) => {
          // Archivo actual primero, luego por fecha descendente
          if (a.name === 'combined.log') return -1;
          if (b.name === 'combined.log') return 1;
          return b.date.localeCompare(a.date);
        });

      res.json({ files });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lee logs de un archivo específico o del actual
   */
  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { fecha, nivel, busqueda, page = 1, limit = 100 } = z.object({
        fecha: z.string().optional(),
        nivel: z.enum(['error', 'warn', 'info', 'debug']).optional(),
        busqueda: z.string().optional(),
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(100),
      }).parse(req.query);

      const logsDir = path.join(process.cwd(), 'logs');

      // Determinar qué archivo leer
      let logFile: string;
      let isCompressed = false;

      if (fecha) {
        // Buscar archivo con esa fecha
        const baseName = `combined-${fecha}`;
        const logPath = path.join(logsDir, `${baseName}.log`);
        const gzPath = path.join(logsDir, `${baseName}.log.gz`);

        if (fs.existsSync(logPath)) {
          logFile = logPath;
        } else if (fs.existsSync(gzPath)) {
          logFile = gzPath;
          isCompressed = true;
        } else {
          return res.json({ logs: [], total: 0, page: 1, totalPages: 0 });
        }
      } else {
        // Archivo actual (hoy)
        logFile = path.join(logsDir, 'combined.log');
        if (!fs.existsSync(logFile)) {
          return res.json({ logs: [], total: 0, page: 1, totalPages: 0 });
        }
      }

      // Leer contenido del archivo
      let content: string;
      if (isCompressed) {
        const compressed = fs.readFileSync(logFile);
        content = zlib.gunzipSync(compressed).toString('utf-8');
      } else {
        content = fs.readFileSync(logFile, 'utf-8');
      }

      // Procesar líneas
      let lines = content.split('\n').filter(Boolean);

      // Filtrar por nivel
      if (nivel) {
        lines = lines.filter(line =>
          line.toLowerCase().includes(`[${nivel}]`)
        );
      }

      // Filtrar por búsqueda
      if (busqueda) {
        const searchLower = busqueda.toLowerCase();
        lines = lines.filter(line =>
          line.toLowerCase().includes(searchLower)
        );
      }

      // Invertir para mostrar más recientes primero
      lines = lines.reverse();

      // Paginación
      const total = lines.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const paginatedLines = lines.slice(start, start + limit);

      res.json({
        logs: paginatedLines,
        total,
        page,
        totalPages,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Obtiene estadísticas de logs
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const logsDir = path.join(process.cwd(), 'logs');

      if (!fs.existsSync(logsDir)) {
        return res.json({
          totalFiles: 0,
          totalSize: '0 B',
          errorsToday: 0,
          warningsToday: 0,
        });
      }

      const files = fs.readdirSync(logsDir);
      let totalSize = 0;
      let errorsToday = 0;
      let warningsToday = 0;

      const today = new Date().toISOString().split('T')[0];

      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        // Contar errores y warnings de hoy
        if (file === 'combined.log' || file.includes(today)) {
          let content: string;
          if (file.endsWith('.gz')) {
            const compressed = fs.readFileSync(filePath);
            content = zlib.gunzipSync(compressed).toString('utf-8');
          } else {
            content = fs.readFileSync(filePath, 'utf-8');
          }
          errorsToday += (content.match(/\[error\]/gi) || []).length;
          warningsToday += (content.match(/\[warn\]/gi) || []).length;
        }
      }

      res.json({
        totalFiles: files.length,
        totalSize: this.formatBytes(totalSize),
        errorsToday,
        warningsToday,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Descarga un archivo de log
   */
  async downloadLog(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename } = z.object({
        filename: z.string().regex(/^[\w\-\.]+\.log(\.gz)?$/),
      }).parse(req.params);

      const filePath = path.join(process.cwd(), 'logs', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Archivo no encontrado' });
      }

      // Si es .gz, descomprimir antes de enviar
      if (filename.endsWith('.gz')) {
        const compressed = fs.readFileSync(filePath);
        const decompressed = zlib.gunzipSync(compressed);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename.replace('.gz', '')}"`);
        return res.send(decompressed);
      }

      res.download(filePath);
    } catch (err) {
      next(err);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private extractDate(filename: string): string {
    const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : new Date().toISOString().split('T')[0];
  }
}

export const adminLogsController = new AdminLogsController();
