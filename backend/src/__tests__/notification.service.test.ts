import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/database', () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../shared/services/email.service', () => ({
  emailService: {
    send: vi.fn(),
  },
}));

vi.mock('../config/notifications', () => ({
  NOTIFICATIONS_CONFIG: {
    email: true,
    whatsapp: false,
    internal: true,
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

import { NotificationService } from '../shared/services/notification.service';
import { prisma } from '../config/database';
import { emailService } from '../shared/services/email.service';

const makeReservationData = (overrides = {}) => ({
  reservationId: 'resv-uuid-001',
  vendorEmail: 'luis@paguito.com',
  vendorNombre: 'Luis Martínez',
  clienteNombre: 'Juan Pérez',
  clienteTelefono: '9611234567',
  clienteCurp: 'PEGJ900101HCHRRS01',
  productoNombre: 'iPhone 14 Pro',
  tipoPago: 'CONTADO',
  direccion: 'Calle Hidalgo 123, Tapachula',
  fechaPreferida: new Date('2026-03-30'),
  horarioPreferido: '10:00',
  latitude: 14.9054,
  longitude: -92.2630,
  ...overrides,
});

const makeStockAlertData = (overrides = {}) => ({
  reservationId: 'resv-uuid-001',
  productId: 'prod-uuid-001',
  productoNombre: 'iPhone 14 Pro',
  clienteNombre: 'Juan Pérez',
  stockActual: 0,
  ...overrides,
});

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── sendReservationNotification ────────────────────────────────────────────────
  describe('sendReservationNotification', () => {
    it('ejecuta notificaciones configuradas', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(emailService.send).mockResolvedValue(undefined);

      const data = makeReservationData();
      await NotificationService.sendReservationNotification(data);

      // email (habilitado) + internal (habilitado) = 2 notificaciones
      // whatsapp está deshabilitado en el mock
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'luis@paguito.com',
          subject: expect.stringContaining('Juan Pérez'),
        })
      );
    });

    it('no falla si una notificación falla (Promise.allSettled)', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      // Email falla
      vi.mocked(emailService.send).mockRejectedValue(new Error('SMTP down'));

      const data = makeReservationData();

      // No debe lanzar error gracias a Promise.allSettled
      await expect(
        NotificationService.sendReservationNotification(data)
      ).resolves.not.toThrow();
    });

    it('guarda notificación interna', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(emailService.send).mockResolvedValue(undefined);

      const data = makeReservationData();
      await NotificationService.sendReservationNotification(data);

      // Debe haber creado la notificación interna con canal INTERNAL
      const internalCall = vi.mocked(prisma.notification.create).mock.calls.find(
        (call) => call[0].data.canal === 'INTERNAL'
      );
      expect(internalCall).toBeDefined();
      expect(internalCall![0].data.mensaje).toContain(data.clienteNombre);
    });
  });

  // ── sendStockAgotadoAlert ──────────────────────────────────────────────────────
  describe('sendStockAgotadoAlert', () => {
    it('envía email a cada admin activo', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { email: 'admin1@paguito.com', nombre: 'Admin Uno' },
        { email: 'admin2@paguito.com', nombre: 'Admin Dos' },
      ] as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(emailService.send).mockResolvedValue(undefined);

      await NotificationService.sendStockAgotadoAlert(makeStockAlertData());

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { rol: 'ADMIN', isActive: true },
        select: { email: true, nombre: true },
      });
      expect(emailService.send).toHaveBeenCalledTimes(2);
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'admin1@paguito.com' })
      );
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'admin2@paguito.com' })
      );
    });

    it('no falla si no hay admins', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await expect(
        NotificationService.sendStockAgotadoAlert(makeStockAlertData())
      ).resolves.not.toThrow();

      expect(emailService.send).not.toHaveBeenCalled();
    });

    it('guarda notificación interna de auditoría', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { email: 'admin@paguito.com', nombre: 'Admin' },
      ] as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(emailService.send).mockResolvedValue(undefined);

      const data = makeStockAlertData();
      await NotificationService.sendStockAgotadoAlert(data);

      const internalCall = vi.mocked(prisma.notification.create).mock.calls.find(
        (call) => call[0].data.canal === 'INTERNAL'
      );
      expect(internalCall).toBeDefined();
      expect(internalCall![0].data.mensaje).toContain('iPhone 14 Pro');
      expect(internalCall![0].data.mensaje).toContain('stock: 0');
    });
  });
});
