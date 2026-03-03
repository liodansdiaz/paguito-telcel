import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { customerService } from './customer.service';
import { sendSuccess, sendPaginated } from '../../shared/utils/response.helper';

export class CustomerController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, estado, page, limit } = req.query;
      const result = await customerService.getAll({
        search: search as string,
        estado: estado as any,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      sendPaginated(res, result.data, result.total, parseInt((page as string) || '1'), parseInt((limit as string) || '20'));
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.getById(req.params['id'] as string);
      sendSuccess(res, customer);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { estado } = z.object({ estado: z.enum(['ACTIVO', 'BLOQUEADO']) }).parse(req.body);
      const customer = await customerService.updateStatus(req.params['id'] as string, estado);
      sendSuccess(res, customer, `Cliente ${estado === 'ACTIVO' ? 'activado' : 'bloqueado'}`);
    } catch (err) {
      next(err);
    }
  }
}

export const customerController = new CustomerController();
