import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks de módulos con dependencias externas ────────────────────────────────

vi.mock('../modules/customers/customer.repository', () => ({
  customerRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Imports post-mock ─────────────────────────────────────────────────────────
import { CustomerService } from '../modules/customers/customer.service';
import { customerRepository } from '../modules/customers/customer.repository';

// ── Datos de prueba reutilizables ─────────────────────────────────────────────
const mockCustomer = {
  id: 'cust-uuid-001',
  nombreCompleto: 'Juan Pérez García',
  telefono: '9611234567',
  curp: 'PEGJ900101HCHRRS01',
  email: 'juan@example.com',
  direccion: 'Calle Hidalgo 123, Tapachula, Chiapas',
  estado: 'ACTIVO',
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { reservations: 2 },
};

const mockCustomer2 = {
  id: 'cust-uuid-002',
  nombreCompleto: 'María López Hernández',
  telefono: '9627654321',
  curp: 'LOHM850203MCHPRR02',
  email: 'maria@example.com',
  direccion: 'Av. Central 456, Tuxtla Gutiérrez, Chiapas',
  estado: 'ACTIVO',
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { reservations: 0 },
};

// ─────────────────────────────────────────────────────────────────────────────

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CustomerService();
  });

  // ── getAll ────────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('devuelve lista de clientes', async () => {
      const mockResult = { data: [mockCustomer, mockCustomer2], total: 2 };
      vi.mocked(customerRepository.findAll).mockResolvedValue(mockResult as any);

      const result = await service.getAll({});

      expect(result).toEqual(mockResult);
      expect(result.data).toHaveLength(2);
      expect(customerRepository.findAll).toHaveBeenCalledWith({});
    });

    it('pasa los filtros al repositorio', async () => {
      const filters = { search: 'Juan', estado: 'ACTIVO' as const, page: 1, limit: 10 };
      const mockResult = { data: [mockCustomer], total: 1 };
      vi.mocked(customerRepository.findAll).mockResolvedValue(mockResult as any);

      await service.getAll(filters);

      expect(customerRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('devuelve cliente si existe', async () => {
      vi.mocked(customerRepository.findById).mockResolvedValue(mockCustomer as any);

      const result = await service.getById('cust-uuid-001');

      expect(result).toEqual(mockCustomer);
      expect(customerRepository.findById).toHaveBeenCalledWith('cust-uuid-001');
    });

    it('lanza 404 si no existe', async () => {
      vi.mocked(customerRepository.findById).mockResolvedValue(null);

      await expect(service.getById('inexistente'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── updateStatus ──────────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('actualiza estado correctamente', async () => {
      vi.mocked(customerRepository.findById).mockResolvedValue(mockCustomer as any);
      vi.mocked(customerRepository.updateStatus).mockResolvedValue({
        ...mockCustomer,
        estado: 'INACTIVO',
      } as any);

      const result = await service.updateStatus('cust-uuid-001', 'INACTIVO' as any);

      expect(result.estado).toBe('INACTIVO');
      expect(customerRepository.findById).toHaveBeenCalledWith('cust-uuid-001');
      expect(customerRepository.updateStatus).toHaveBeenCalledWith('cust-uuid-001', 'INACTIVO');
    });

    it('lanza 404 si cliente no existe', async () => {
      vi.mocked(customerRepository.findById).mockResolvedValue(null);

      await expect(service.updateStatus('inexistente', 'INACTIVO' as any))
        .rejects.toMatchObject({ statusCode: 404 });

      expect(customerRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});
