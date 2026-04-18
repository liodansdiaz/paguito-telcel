import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { chatConfigService } from '../../shared/services/chat-config.service';
import { sendSuccess } from '../../shared/utils/response.helper';
import { AppError } from '../../shared/middleware/error.middleware';

// Schemas de validación
const createSectionSchema = z.object({
  section: z.string().min(1).max(50).regex(/^[a-z_]+$/, 'El identificador debe ser en minúsculas con guiones bajos'),
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  order: z.number().int().min(1),
  isActive: z.boolean().optional().default(true),
});

const updateSectionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).optional(),
  order: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

const toggleSectionSchema = z.object({
  isActive: z.boolean(),
});

/**
 * AdminChatConfigController
 * 
 * Controlador para gestionar la configuración del asistente virtual (chat).
 * Solo accesible para administradores.
 */
export class AdminChatConfigController {
  /**
   * GET /api/admin/chat-config
   * Obtiene todas las secciones del chat (activas e inactivas)
   */
  async getAllSections(req: Request, res: Response, next: NextFunction) {
    try {
      const sections = await chatConfigService.getAllSections();
      sendSuccess(res, { sections }, 'Secciones obtenidas correctamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/chat-config/:section
   * Obtiene una sección específica por su identificador
   */
  async getSectionByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { section } = req.params;
      const sectionData = await chatConfigService.getSectionByKey(section);

      if (!sectionData) {
        throw new AppError('Sección no encontrada', 404);
      }

      sendSuccess(res, { section: sectionData }, 'Sección obtenida correctamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/chat-config
   * Crea una nueva sección
   */
  async createSection(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSectionSchema.parse(req.body);

      // Verificar que no exista ya una sección con ese identificador
      const existing = await chatConfigService.getSectionByKey(data.section);
      if (existing) {
        throw new AppError('Ya existe una sección con ese identificador', 400);
      }

      const newSection = await chatConfigService.createSection(data);
      sendSuccess(res, { section: newSection }, 'Sección creada correctamente', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/chat-config/:section
   * Actualiza una sección existente
   */
  async updateSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { section } = req.params;
      const data = updateSectionSchema.parse(req.body);

      // Verificar que exista
      const existing = await chatConfigService.getSectionByKey(section);
      if (!existing) {
        throw new AppError('Sección no encontrada', 404);
      }

      const updated = await chatConfigService.updateSection(section, data);
      sendSuccess(res, { section: updated }, 'Sección actualizada correctamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/chat-config/:section
   * Elimina una sección
   */
  async deleteSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { section } = req.params;

      // Verificar que exista
      const existing = await chatConfigService.getSectionByKey(section);
      if (!existing) {
        throw new AppError('Sección no encontrada', 404);
      }

      await chatConfigService.deleteSection(section);
      sendSuccess(res, null, 'Sección eliminada correctamente');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/chat-config/:section/toggle
   * Activa o desactiva una sección
   */
  async toggleSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { section } = req.params;
      const { isActive } = toggleSectionSchema.parse(req.body);

      // Verificar que exista
      const existing = await chatConfigService.getSectionByKey(section);
      if (!existing) {
        throw new AppError('Sección no encontrada', 404);
      }

      const updated = await chatConfigService.toggleSection(section, isActive);
      sendSuccess(
        res,
        { section: updated },
        `Sección ${isActive ? 'activada' : 'desactivada'} correctamente`
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/chat-config/preview/system-prompt
   * Preview del SYSTEM_PROMPT completo (útil para ver cómo quedará antes de guardarlo)
   */
  async previewSystemPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const systemPrompt = await chatConfigService.buildSystemPrompt();
      sendSuccess(res, { systemPrompt }, 'Preview del SYSTEM_PROMPT');
    } catch (err) {
      next(err);
    }
  }
}

export const adminChatConfigController = new AdminChatConfigController();
