import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks de módulos con dependencias externas ────────────────────────────────
// Se declaran ANTES del import del servicio para que Vitest los intercepte.

vi.mock('../modules/products/product.repository', () => ({
  productRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../modules/customers/customer.repository', () => ({
  customerRepository: {
    upsertByCurp: vi.fn(),
  },
}));

vi.mock('../modules/reservations/reservation.repository', () => ({
  reservationRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findActiveByCurpOrId: vi.fn(),
    findActiveCreditItemByCustomer: vi.fn(),
    findItemById: vi.fn(),
    updateStatus: vi.fn(),
    updateItemStatus: vi.fn(),
    markItemAsSold: vi.fn(),
    cancelItem: vi.fn(),
    cancelReservation: vi.fn(),
    findAll: vi.fn(),
    findByVendor: vi.fn(),
    findMapDataByVendor: vi.fn(),
    assignVendor: vi.fn(),
  },
}));

vi.mock('../shared/services/roundrobin.service', () => ({
  RoundRobinService: {
    getNextVendor: vi.fn(),
  },
}));

vi.mock('../shared/services/notification.service', () => ({
  NotificationService: {
    sendReservationNotification: vi.fn().mockResolvedValue(undefined),
    sendStockAgotadoAlert: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../config/database', () => ({
  prisma: {
    user: {
      findUniqueOrThrow: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Logger silenciado para no ensuciar la salida de tests
vi.mock('../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Imports post-mock ─────────────────────────────────────────────────────────
import { ReservationService } from '../modules/reservations/reservation.service';
import { productRepository } from '../modules/products/product.repository';
import { customerRepository } from '../modules/customers/customer.repository';
import { reservationRepository } from '../modules/reservations/reservation.repository';
import { RoundRobinService } from '../shared/services/roundrobin.service';
import { prisma } from '../config/database';

// ── Datos de prueba reutilizables ─────────────────────────────────────────────
const LUNES_VALIDO = new Date('2026-03-09T12:00:00.000Z'); // lunes

const makeDTO = (overrides = {}) => ({
  items: [
    {
      productId: 'prod-uuid-001',
      tipoPago: 'CONTADO' as const,
      color: 'Negro',
      memoria: '128GB',
    }
  ],
  nombreCompleto: 'Juan Pérez García',
  telefono: '9611234567',
  curp: 'PEGJ900101HCHRRS01',
  direccion: 'Calle Hidalgo 123, Tapachula, Chiapas',
  fechaPreferida: LUNES_VALIDO,
  horarioPreferido: '10:00',
  latitude: 14.9054,
  longitude: -92.2630,
  ...overrides,
});

const mockProduct = {
  id: 'prod-uuid-001',
  nombre: 'iPhone 14 Pro',
  isActive: true,
  stock: 5,
  precio: 15999,
  disponibleCredito: true,
};

const mockCustomer = {
  id: 'cust-uuid-001',
  nombreCompleto: 'Juan Pérez García',
  curp: 'PEGJ900101HCHRRS01',
};

const mockVendor = {
  id: 'vendor-uuid-001',
  nombre: 'Luis Martínez',
  email: 'luis@paguito.com',
};

const mockReservation = {
  id: 'resv-uuid-001',
  nombreCompleto: 'Juan Pérez García',
  telefono: '9611234567',
  curp: 'PEGJ900101HCHRRS01',
  direccion: 'Calle Hidalgo 123, Tapachula, Chiapas',
  fechaPreferida: LUNES_VALIDO,
  horarioPreferido: '10:00',
  latitude: 14.9054,
  longitude: -92.2630,
  estado: 'ASIGNADA',
  estadoDetalle: { total: 1, pendientes: 1, vendidos: 0, cancelados: 0 },
  customerId: mockCustomer.id,
  vendorId: mockVendor.id,
  items: [
    {
      id: 'item-uuid-001',
      productId: 'prod-uuid-001',
      tipoPago: 'CONTADO',
      estado: 'PENDIENTE',
      precioCapturado: 15999,
      color: 'Negro',
      memoria: '128GB',
      product: mockProduct,
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockItem = {
  id: 'item-uuid-001',
  reservationId: 'resv-uuid-001',
  productId: 'prod-uuid-001',
  tipoPago: 'CONTADO',
  estado: 'PENDIENTE',
  precioCapturado: 15999,
  color: 'Negro',
  memoria: '128GB',
  product: mockProduct,
  reservation: {
    id: 'resv-uuid-001',
    nombreCompleto: 'Juan Pérez García',
  },
};

// ─────────────────────────────────────────────────────────────────────────────

describe('ReservationService', () => {
  let service: ReservationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReservationService();

    // Defaults felices — cada test puede sobrescribir los que necesite
    vi.mocked(productRepository.findById).mockResolvedValue(mockProduct as any);
    vi.mocked(customerRepository.upsertByCurp).mockResolvedValue(mockCustomer as any);
    vi.mocked(reservationRepository.findActiveCreditItemByCustomer).mockResolvedValue(null);
    vi.mocked(reservationRepository.create).mockResolvedValue(mockReservation as any);
    vi.mocked(reservationRepository.assignVendor).mockResolvedValue(mockReservation as any);
    vi.mocked(RoundRobinService.getNextVendor).mockResolvedValue(mockVendor.id);
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockVendor as any);
  });

  // ── createReservation ───────────────────────────────────────────────────────
  describe('createReservation', () => {
    it('crea una reserva exitosamente con un producto', async () => {
      const result = await service.createReservation(makeDTO());

      expect(result).toEqual(mockReservation);
      expect(productRepository.findById).toHaveBeenCalledWith('prod-uuid-001');
      expect(RoundRobinService.getNextVendor).toHaveBeenCalledOnce();
      expect(reservationRepository.create).toHaveBeenCalledOnce();
      expect(reservationRepository.assignVendor).toHaveBeenCalledWith('resv-uuid-001', 'vendor-uuid-001');
    });

    it('crea una reserva con múltiples productos', async () => {
      const mockProduct2 = { ...mockProduct, id: 'prod-uuid-002', nombre: 'Samsung Galaxy S23' };
      vi.mocked(productRepository.findById)
        .mockResolvedValueOnce(mockProduct as any)
        .mockResolvedValueOnce(mockProduct2 as any);

      const dto = makeDTO({
        items: [
          { productId: 'prod-uuid-001', tipoPago: 'CONTADO', color: 'Negro', memoria: '128GB' },
          { productId: 'prod-uuid-002', tipoPago: 'CONTADO', color: 'Blanco', memoria: '256GB' },
        ]
      });

      await service.createReservation(dto);

      expect(productRepository.findById).toHaveBeenCalledTimes(2);
      expect(reservationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({ productId: 'prod-uuid-001', tipoPago: 'CONTADO' }),
            expect.objectContaining({ productId: 'prod-uuid-002', tipoPago: 'CONTADO' }),
          ])
        })
      );
    });

    it('convierte la CURP a mayúsculas antes de guardar', async () => {
      await service.createReservation(makeDTO({ curp: 'pegj900101hchrrs01' }));

      expect(customerRepository.upsertByCurp).toHaveBeenCalledWith(
        expect.objectContaining({ curp: 'PEGJ900101HCHRRS01' })
      );
    });

    it('lanza 400 si no hay items en el carrito', async () => {
      await expect(service.createReservation(makeDTO({ items: [] })))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza 404 si algún producto no existe', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(service.createReservation(makeDTO()))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza 404 si algún producto está inactivo', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue({
        ...mockProduct, isActive: false,
      } as any);

      await expect(service.createReservation(makeDTO()))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('permite crear reserva con producto sin stock (notifica admin)', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue({
        ...mockProduct, stock: 0,
      } as any);

      const result = await service.createReservation(makeDTO());

      expect(result).toBeDefined();
      expect(reservationRepository.create).toHaveBeenCalled();
    });

    it('lanza 422 si el horario es un domingo', async () => {
      const domingo = new Date('2026-03-15T12:00:00.000Z'); // domingo

      await expect(
        service.createReservation(makeDTO({ fechaPreferida: domingo, horarioPreferido: '10:00' }))
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    it('lanza 422 si el horario está fuera de rango en día de semana', async () => {
      await expect(
        service.createReservation(makeDTO({ horarioPreferido: '18:00' }))
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    it('lanza 409 si el cliente ya tiene un producto a crédito activo', async () => {
      vi.mocked(reservationRepository.findActiveCreditItemByCustomer).mockResolvedValue({
        id: 'item-existente',
        product: { nombre: 'iPhone 13' },
      } as any);

      await expect(
        service.createReservation(makeDTO({ 
          items: [{ productId: 'prod-uuid-001', tipoPago: 'CREDITO' }]
        }))
      ).rejects.toMatchObject({ 
        statusCode: 409
      });
    });

    it('lanza 400 si intenta agregar más de 1 producto a crédito en el mismo carrito', async () => {
      const dto = makeDTO({
        items: [
          { productId: 'prod-uuid-001', tipoPago: 'CREDITO' },
          { productId: 'prod-uuid-002', tipoPago: 'CREDITO' },
        ]
      });

      await expect(service.createReservation(dto))
        .rejects.toMatchObject({ 
          statusCode: 400
        });
    });

    it('permite múltiples productos de contado sin restricción', async () => {
      const mockProduct2 = { ...mockProduct, id: 'prod-uuid-002' };
      const mockProduct3 = { ...mockProduct, id: 'prod-uuid-003' };
      
      vi.mocked(productRepository.findById)
        .mockResolvedValueOnce(mockProduct as any)
        .mockResolvedValueOnce(mockProduct2 as any)
        .mockResolvedValueOnce(mockProduct3 as any);

      const dto = makeDTO({
        items: [
          { productId: 'prod-uuid-001', tipoPago: 'CONTADO' },
          { productId: 'prod-uuid-002', tipoPago: 'CONTADO' },
          { productId: 'prod-uuid-003', tipoPago: 'CONTADO' },
        ]
      });

      const result = await service.createReservation(dto);

      expect(result).toBeDefined();
      expect(reservationRepository.create).toHaveBeenCalled();
    });

    it('permite 1 producto a crédito + varios de contado', async () => {
      const mockProduct2 = { ...mockProduct, id: 'prod-uuid-002' };
      
      vi.mocked(productRepository.findById)
        .mockResolvedValueOnce(mockProduct as any)
        .mockResolvedValueOnce(mockProduct2 as any);

      const dto = makeDTO({
        items: [
          { productId: 'prod-uuid-001', tipoPago: 'CREDITO' },
          { productId: 'prod-uuid-002', tipoPago: 'CONTADO' },
        ]
      });

      const result = await service.createReservation(dto);

      expect(result).toBeDefined();
      expect(reservationRepository.create).toHaveBeenCalled();
    });
  });

  // ── getById ─────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('devuelve la reserva con todos sus items', async () => {
      vi.mocked(reservationRepository.findById).mockResolvedValue(mockReservation as any);

      const result = await service.getById('resv-uuid-001');

      expect(result).toEqual(mockReservation);
      expect(result.items).toHaveLength(1);
    });

    it('lanza 404 si la reserva no existe', async () => {
      vi.mocked(reservationRepository.findById).mockResolvedValue(null);

      await expect(service.getById('inexistente'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── updateItemStatus ────────────────────────────────────────────────────────
  describe('updateItemStatus', () => {
    it('actualiza el estado de un item correctamente', async () => {
      vi.mocked(reservationRepository.findItemById).mockResolvedValue(mockItem as any);
      vi.mocked(reservationRepository.updateItemStatus).mockResolvedValue({
        ...mockItem,
        estado: 'EN_PROCESO',
      } as any);

      const result = await service.updateItemStatus('item-uuid-001', 'EN_PROCESO', 'Cliente confirmó visita');

      expect(result.estado).toBe('EN_PROCESO');
      expect(reservationRepository.updateItemStatus).toHaveBeenCalledWith(
        'item-uuid-001',
        'EN_PROCESO',
        'Cliente confirmó visita'
      );
    });

    it('lanza 404 si el item no existe', async () => {
      vi.mocked(reservationRepository.findItemById).mockResolvedValue(null);

      await expect(service.updateItemStatus('inexistente', 'VENDIDO'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── markItemAsSold ──────────────────────────────────────────────────────────
  describe('markItemAsSold', () => {
    it('marca un item como vendido y decrementa stock', async () => {
      vi.mocked(reservationRepository.findItemById).mockResolvedValue(mockItem as any);
      vi.mocked(reservationRepository.markItemAsSold).mockResolvedValue({
        ...mockItem,
        estado: 'VENDIDO',
      } as any);

      const result = await service.markItemAsSold('item-uuid-001', 'Venta completada');

      expect(result).toBeDefined();
      expect(reservationRepository.markItemAsSold).toHaveBeenCalledWith(
        'item-uuid-001',
        'Venta completada'
      );
    });

    it('lanza 404 si el item no existe', async () => {
      vi.mocked(reservationRepository.findItemById).mockResolvedValue(null);

      await expect(service.markItemAsSold('inexistente'))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza 400 si el item no está en estado válido para vender', async () => {
      vi.mocked(reservationRepository.findItemById).mockResolvedValue({
        ...mockItem,
        estado: 'CANCELADO',
      } as any);

      await expect(service.markItemAsSold('item-uuid-001'))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── cancelItem ──────────────────────────────────────────────────────────────
  describe('cancelItem', () => {
    it('cancela un item individual correctamente', async () => {
      vi.mocked(reservationRepository.findItemById).mockResolvedValue(mockItem as any);
      vi.mocked(reservationRepository.cancelItem).mockResolvedValue({
        ...mockItem,
        estado: 'CANCELADO',
      } as any);

      const result = await service.cancelItem('item-uuid-001', 'Cliente cambió de opinión');

      expect(result.estado).toBe('CANCELADO');
      expect(reservationRepository.cancelItem).toHaveBeenCalledWith(
        'item-uuid-001',
        'Cliente cambió de opinión'
      );
    });

    it('lanza 400 si el item ya fue procesado', async () => {
      vi.mocked(reservationRepository.findItemById).mockResolvedValue({
        ...mockItem,
        estado: 'VENDIDO',
      } as any);

      await expect(service.cancelItem('item-uuid-001'))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── cancelReservation ───────────────────────────────────────────────────────
  describe('cancelReservation', () => {
    it('cancela toda la reserva (todos los items activos)', async () => {
      vi.mocked(reservationRepository.findById).mockResolvedValue(mockReservation as any);
      vi.mocked(reservationRepository.cancelReservation).mockResolvedValue({
        ...mockReservation,
        estado: 'CANCELADA',
      } as any);

      const result = await service.cancelReservation('resv-uuid-001', 'Cancelación por admin');

      expect(result.estado).toBe('CANCELADA');
      expect(reservationRepository.cancelReservation).toHaveBeenCalledWith(
        'resv-uuid-001',
        'Cancelación por admin'
      );
    });

    it('lanza 400 si la reserva ya fue completada', async () => {
      vi.mocked(reservationRepository.findById).mockResolvedValue({
        ...mockReservation,
        estado: 'COMPLETADA',
      } as any);

      await expect(service.cancelReservation('resv-uuid-001'))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── consultarReserva ────────────────────────────────────────────────────────
  describe('consultarReserva', () => {
    it('devuelve la reserva con sus items si existe', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue(mockReservation as any);

      const result = await service.consultarReserva('PEGJ900101HCHRRS01');

      expect(result).toEqual(mockReservation);
      expect(result.items).toBeDefined();
    });

    it('lanza 400 si la búsqueda es muy corta', async () => {
      await expect(service.consultarReserva('ABC'))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza 404 si no encuentra la reserva', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue(null);

      await expect(service.consultarReserva('CURP_INEXISTENTE'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── cancelarPorCliente ──────────────────────────────────────────────────────
  describe('cancelarPorCliente', () => {
    it('cancela la reserva completa si no se proporciona itemId', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue(mockReservation as any);
      vi.mocked(reservationRepository.findById).mockResolvedValue(mockReservation as any);
      vi.mocked(reservationRepository.cancelReservation).mockResolvedValue({
        ...mockReservation,
        estado: 'CANCELADA',
      } as any);

      await service.cancelarPorCliente('PEGJ900101HCHRRS01');

      expect(reservationRepository.cancelReservation).toHaveBeenCalledWith(
        'resv-uuid-001',
        'Cancelada por el cliente desde la web.'
      );
    });

    it('cancela solo un item si se proporciona itemId', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue(mockReservation as any);
      vi.mocked(reservationRepository.findItemById).mockResolvedValue(mockItem as any);
      vi.mocked(reservationRepository.cancelItem).mockResolvedValue({
        ...mockItem,
        estado: 'CANCELADO',
      } as any);

      await service.cancelarPorCliente('PEGJ900101HCHRRS01', 'item-uuid-001');

      expect(reservationRepository.cancelItem).toHaveBeenCalledWith(
        'item-uuid-001',
        'Cancelado por el cliente desde la web.'
      );
    });

    it('lanza 404 si el item no pertenece a la reserva', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue({
        ...mockReservation,
        items: [{ id: 'otro-item-uuid', estado: 'PENDIENTE' }],
      } as any);

      await expect(service.cancelarPorCliente('PEGJ900101HCHRRS01', 'item-uuid-001'))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza 400 si el item ya está en proceso', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue({
        ...mockReservation,
        items: [{ ...mockItem, estado: 'EN_PROCESO' }],
      } as any);

      await expect(service.cancelarPorCliente('PEGJ900101HCHRRS01', 'item-uuid-001'))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza 409 si la reserva ya está en visita', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue({
        ...mockReservation,
        estado: 'EN_VISITA',
      } as any);

      await expect(service.cancelarPorCliente('PEGJ900101HCHRRS01'))
        .rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ── assignVendor ────────────────────────────────────────────────────────────
  describe('assignVendor', () => {
    it('asigna un vendedor a la reserva', async () => {
      vi.mocked(reservationRepository.findById).mockResolvedValue(mockReservation as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockVendor, isActive: true } as any);
      vi.mocked(reservationRepository.assignVendor).mockResolvedValue({
        ...mockReservation,
        vendorId: 'nuevo-vendor-id',
      } as any);

      await service.assignVendor('resv-uuid-001', 'nuevo-vendor-id');

      expect(reservationRepository.assignVendor).toHaveBeenCalledWith('resv-uuid-001', 'nuevo-vendor-id');
    });

    it('lanza 404 si el vendedor no existe o está inactivo', async () => {
      vi.mocked(reservationRepository.findById).mockResolvedValue(mockReservation as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(service.assignVendor('resv-uuid-001', 'inexistente'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── getAll ──────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('devuelve todas las reservas con paginación', async () => {
      const mockData = { data: [mockReservation], total: 1 };
      vi.mocked(reservationRepository.findAll).mockResolvedValue(mockData as any);

      const result = await service.getAll({ page: 1, limit: 20 });

      expect(result).toEqual(mockData);
      expect(reservationRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  // ── getVendorReservations ───────────────────────────────────────────────────
  describe('getVendorReservations', () => {
    it('devuelve las reservas de un vendedor', async () => {
      const mockData = { data: [mockReservation], total: 1 };
      vi.mocked(reservationRepository.findByVendor).mockResolvedValue(mockData as any);

      const result = await service.getVendorReservations('vendor-uuid-001', {});

      expect(result).toEqual(mockData);
      expect(reservationRepository.findByVendor).toHaveBeenCalledWith('vendor-uuid-001', {});
    });
  });

  // ── getVendorMapData ────────────────────────────────────────────────────────
  describe('getVendorMapData', () => {
    it('devuelve datos de mapa del vendedor', async () => {
      const mockMapData = [mockReservation];
      vi.mocked(reservationRepository.findMapDataByVendor).mockResolvedValue(mockMapData as any);

      const result = await service.getVendorMapData('vendor-uuid-001');

      expect(result).toEqual(mockMapData);
    });
  });
});
