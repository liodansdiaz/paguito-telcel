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
    findActiveCreditByCustomer: vi.fn(),
    updateStatus: vi.fn(),
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
  productId: 'prod-uuid-001',
  nombreCompleto: 'Juan Pérez García',
  telefono: '9611234567',
  curp: 'PEGJ900101HCHRRS01',
  tipoPago: 'CONTADO' as const,
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
  ...makeDTO(),
  estado: 'ASIGNADA',
  customerId: mockCustomer.id,
  vendorId: mockVendor.id,
  createdAt: new Date(),
  updatedAt: new Date(),
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
    vi.mocked(reservationRepository.findActiveCreditByCustomer).mockResolvedValue(null);
    vi.mocked(reservationRepository.create).mockResolvedValue(mockReservation as any);
    vi.mocked(RoundRobinService.getNextVendor).mockResolvedValue(mockVendor.id);
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue(mockVendor as any);
  });

  // ── createReservation ───────────────────────────────────────────────────────
  describe('createReservation', () => {
    it('crea una reserva exitosamente con datos válidos', async () => {
      const result = await service.createReservation(makeDTO());

      expect(result).toEqual(mockReservation);
      expect(productRepository.findById).toHaveBeenCalledWith('prod-uuid-001');
      expect(RoundRobinService.getNextVendor).toHaveBeenCalledOnce();
      expect(reservationRepository.create).toHaveBeenCalledOnce();
    });

    it('convierte la CURP a mayúsculas antes de guardar', async () => {
      await service.createReservation(makeDTO({ curp: 'pegj900101hchrrs01' }));

      expect(customerRepository.upsertByCurp).toHaveBeenCalledWith(
        expect.objectContaining({ curp: 'PEGJ900101HCHRRS01' })
      );
    });

    it('lanza 404 si el producto no existe', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue(null);

      await expect(service.createReservation(makeDTO()))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza 404 si el producto está inactivo', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue({
        ...mockProduct, isActive: false,
      } as any);

      await expect(service.createReservation(makeDTO()))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza 409 si el producto no tiene stock', async () => {
      vi.mocked(productRepository.findById).mockResolvedValue({
        ...mockProduct, stock: 0,
      } as any);

      await expect(service.createReservation(makeDTO()))
        .rejects.toMatchObject({ statusCode: 409 });
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

    it('lanza 409 si el cliente ya tiene una reserva a crédito activa', async () => {
      vi.mocked(reservationRepository.findActiveCreditByCustomer).mockResolvedValue({
        id: 'otra-reserva-uuid',
      } as any);

      await expect(
        service.createReservation(makeDTO({ tipoPago: 'CREDITO' }))
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('no verifica reservas a crédito si el pago es de contado', async () => {
      await service.createReservation(makeDTO({ tipoPago: 'CONTADO' }));

      expect(reservationRepository.findActiveCreditByCustomer).not.toHaveBeenCalled();
    });

    it('permite crear reserva a crédito si no tiene ninguna activa', async () => {
      vi.mocked(reservationRepository.findActiveCreditByCustomer).mockResolvedValue(null);

      const result = await service.createReservation(makeDTO({ tipoPago: 'CREDITO' }));

      expect(result).toBeDefined();
      expect(reservationRepository.create).toHaveBeenCalledOnce();
    });

    it('lanza 503 si no hay vendedores activos (Round Robin falla)', async () => {
      vi.mocked(RoundRobinService.getNextVendor).mockRejectedValue(
        Object.assign(new Error('Sin vendedores'), { statusCode: 503 })
      );

      await expect(service.createReservation(makeDTO()))
        .rejects.toMatchObject({ statusCode: 503 });
    });

    it('el repositorio recibe la reserva con estado ASIGNADA', async () => {
      await service.createReservation(makeDTO());

      expect(reservationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'ASIGNADA' })
      );
    });
  });

  // ── cancelarPorCliente ──────────────────────────────────────────────────────
  describe('cancelarPorCliente', () => {
    it('cancela exitosamente una reserva NUEVA', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue({
        ...mockReservation, estado: 'NUEVA',
      } as any);
      vi.mocked(reservationRepository.updateStatus).mockResolvedValue({
        ...mockReservation, estado: 'CANCELADA',
      } as any);

      await expect(service.cancelarPorCliente('RESV0001')).resolves.toBeDefined();
      expect(reservationRepository.updateStatus).toHaveBeenCalledWith(
        mockReservation.id,
        'CANCELADA',
        expect.stringContaining('cliente')
      );
    });

    it('cancela exitosamente una reserva ASIGNADA', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue({
        ...mockReservation, estado: 'ASIGNADA',
      } as any);
      vi.mocked(reservationRepository.updateStatus).mockResolvedValue({} as any);

      await expect(service.cancelarPorCliente('RESV0001')).resolves.toBeDefined();
    });

    it('lanza 409 si la reserva está EN_VISITA', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue({
        ...mockReservation, estado: 'EN_VISITA',
      } as any);

      await expect(service.cancelarPorCliente('RESV0001'))
        .rejects.toMatchObject({ statusCode: 409 });

      expect(reservationRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('lanza 400 si la búsqueda es menor a 8 caracteres', async () => {
      await expect(service.cancelarPorCliente('ABC'))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza 404 si no se encuentra la reserva', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue(null);

      await expect(service.cancelarPorCliente('FOLIO123'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── updateStatus ────────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('actualiza el estado correctamente', async () => {
      vi.mocked(reservationRepository.findById).mockResolvedValue(mockReservation as any);
      vi.mocked(reservationRepository.updateStatus).mockResolvedValue({
        ...mockReservation, estado: 'VENDIDA',
      } as any);

      const result = await service.updateStatus(mockReservation.id, 'VENDIDA', 'Venta exitosa');

      expect(reservationRepository.updateStatus).toHaveBeenCalledWith(
        mockReservation.id, 'VENDIDA', 'Venta exitosa'
      );
      expect(result).toMatchObject({ estado: 'VENDIDA' });
    });

    it('lanza 404 si la reserva no existe', async () => {
      vi.mocked(reservationRepository.findById).mockResolvedValue(null);

      await expect(service.updateStatus('id-inexistente', 'VENDIDA'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── consultarReserva ────────────────────────────────────────────────────────
  describe('consultarReserva', () => {
    it('retorna la reserva cuando se encuentra por folio', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue(mockReservation as any);

      const result = await service.consultarReserva('RESV0001');
      expect(result).toEqual(mockReservation);
    });

    it('lanza 400 para búsqueda vacía', async () => {
      await expect(service.consultarReserva(''))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza 400 para búsqueda menor a 8 caracteres', async () => {
      await expect(service.consultarReserva('ABC'))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza 404 cuando no se encuentra la reserva', async () => {
      vi.mocked(reservationRepository.findActiveByCurpOrId).mockResolvedValue(null);

      await expect(service.consultarReserva('FOLIO123'))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
