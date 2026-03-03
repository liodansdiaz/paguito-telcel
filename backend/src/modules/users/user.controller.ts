import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from './user.service';
import { sendSuccess } from '../../shared/utils/response.helper';

const createUserSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(['ADMIN', 'VENDEDOR']).optional(),
  zona: z.string().optional(),
  telefono: z.string().optional(),
});

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, isActive, rol } = req.query;
      const users = await userService.getAll({
        search: search as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        rol: rol as any,
      });
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(req.params['id'] as string);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createUserSchema.parse(req.body);
      const user = await userService.create(dto);
      sendSuccess(res, user, 'Vendedor creado', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createUserSchema.partial().omit({ email: true }).parse(req.body);
      const user = await userService.update(req.params['id'] as string, dto);
      sendSuccess(res, user, 'Vendedor actualizado');
    } catch (err) {
      next(err);
    }
  }

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.toggleActive(req.params['id'] as string);
      sendSuccess(res, user, `Vendedor ${user.isActive ? 'activado' : 'desactivado'}`);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.delete(req.params['id'] as string);
      sendSuccess(res, null, 'Vendedor eliminado');
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
