import { customerRepository, CustomerFilters } from './customer.repository';
import { AppError } from '../../shared/middleware/error.middleware';
import { EstadoCliente } from '@prisma/client';

export class CustomerService {
  async getAll(filters: CustomerFilters) {
    return customerRepository.findAll(filters);
  }

  async getById(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new AppError('Cliente no encontrado.', 404);
    return customer;
  }

  async updateStatus(id: string, estado: EstadoCliente) {
    await this.getById(id);
    return customerRepository.updateStatus(id, estado);
  }
}

export const customerService = new CustomerService();
