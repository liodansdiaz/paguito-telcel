import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

vi.mock('../shared/services/whatsapp.service', () => ({
  whatsappService: {
    send: vi.fn(),
    verify: vi.fn(),
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
import { whatsappService } from '../shared/services/whatsapp.service';
import { NOTIFICATIONS_CONFIG } from '../config/notifications';
import { logger } from '../shared/utils/logger';

const makeReservationData = (overrides = {}) => ({
  reservationId: 'resv-uuid-001',
  vendorEmail: 'luis@paguito.com',
  vendorNombre: 'Luis Martínez',
  vendorTelefono: '9621234567',
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

  // ── sendWhatsAppNotification (cuando está habilitado) ──────────────────────────
  describe('sendWhatsAppNotification (canal habilitado)', () => {
    beforeEach(() => {
      // Habilitar WhatsApp para estos tests
      NOTIFICATIONS_CONFIG.whatsapp = true;
      NOTIFICATIONS_CONFIG.email = false; // Deshabilitar email para aislar
    });

    afterEach(() => {
      NOTIFICATIONS_CONFIG.whatsapp = false;
      NOTIFICATIONS_CONFIG.email = true;
    });

    it('envía WhatsApp al vendedor y al cliente', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-wa-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(whatsappService.send).mockResolvedValue({ key: { id: 'msg-001' } } as any);

      const data = makeReservationData();
      await NotificationService.sendReservationNotification(data);

      // Debe enviar 2 WhatsApp: uno al vendedor y uno al cliente
      expect(whatsappService.send).toHaveBeenCalledTimes(2);

      // Verificar mensaje al vendedor
      const vendedorCall = vi.mocked(whatsappService.send).mock.calls.find(
        (call) => call[0].numero === '9621234567'
      );
      expect(vendedorCall).toBeDefined();
      expect(vendedorCall![0].mensaje).toContain('NUEVA RESERVA ASIGNADA');
      expect(vendedorCall![0].mensaje).toContain('Juan Pérez');
      expect(vendedorCall![0].mensaje).toContain('PEGJ900101HCHRRS01');

      // Verificar mensaje al cliente
      const clienteCall = vi.mocked(whatsappService.send).mock.calls.find(
        (call) => call[0].numero === '9611234567'
      );
      expect(clienteCall).toBeDefined();
      expect(clienteCall![0].mensaje).toContain('RESERVA CONFIRMADA');
      expect(clienteCall![0].mensaje).toContain('Juan Pérez');
    });

    it('guarda registro PENDING y luego SENT para cada WhatsApp', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-wa-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(whatsappService.send).mockResolvedValue({ key: { id: 'msg-001' } } as any);

      const data = makeReservationData();
      await NotificationService.sendReservationNotification(data);

      // Verificar que se crearon registros PENDING con canal WHATSAPP
      const pendingCalls = vi.mocked(prisma.notification.create).mock.calls.filter(
        (call) => call[0].data.canal === 'WHATSAPP'
      );
      expect(pendingCalls).toHaveLength(2);

      // Verificar que se actualizaron a SENT
      const sentUpdates = vi.mocked(prisma.notification.update).mock.calls.filter(
        (call) => call[0].data.status === 'SENT'
      );
      expect(sentUpdates).toHaveLength(2);
    });

    it('no envía WhatsApp al vendedor si no tiene teléfono', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-wa-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(whatsappService.send).mockResolvedValue({ key: { id: 'msg-001' } } as any);

      const data = makeReservationData({ vendorTelefono: undefined });
      await NotificationService.sendReservationNotification(data);

      // Solo debe enviar 1 WhatsApp: al cliente
      expect(whatsappService.send).toHaveBeenCalledTimes(1);
      expect(vi.mocked(whatsappService.send).mock.calls[0][0].numero).toBe('9611234567');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('no tiene teléfono configurado')
      );
    });

    it('registra error si el envío al vendedor falla', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-wa-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);

      // El primer call (vendedor) falla, el segundo (cliente) funciona
      vi.mocked(whatsappService.send)
        .mockRejectedValueOnce(new Error('Evolution API error'))
        .mockResolvedValueOnce({ key: { id: 'msg-002' } } as any);

      const data = makeReservationData();

      // No debe lanzar error gracias a Promise.allSettled
      await expect(
        NotificationService.sendReservationNotification(data)
      ).resolves.not.toThrow();

      // Verificar que se registró el error
      const failedUpdate = vi.mocked(prisma.notification.update).mock.calls.find(
        (call) => call[0].data.status === 'FAILED'
      );
      expect(failedUpdate).toBeDefined();
      expect(failedUpdate![0].data.error).toContain('Evolution API error');
    });

    it('incluye link de Google Maps si hay coordenadas', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-wa-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(whatsappService.send).mockResolvedValue({ key: { id: 'msg-001' } } as any);

      const data = makeReservationData({ latitude: 14.9054, longitude: -92.2630 });
      await NotificationService.sendReservationNotification(data);

      const vendedorCall = vi.mocked(whatsappService.send).mock.calls.find(
        (call) => call[0].numero === '9621234567'
      );
      expect(vendedorCall![0].mensaje).toContain('google.com/maps');
      expect(vendedorCall![0].mensaje).toContain('14.9054');
      expect(vendedorCall![0].mensaje).toContain('-92.263');
    });

    it('no incluye link de Maps si no hay coordenadas', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-wa-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(whatsappService.send).mockResolvedValue({ key: { id: 'msg-001' } } as any);

      const data = makeReservationData({ latitude: undefined, longitude: undefined });
      await NotificationService.sendReservationNotification(data);

      const vendedorCall = vi.mocked(whatsappService.send).mock.calls.find(
        (call) => call[0].numero === '9621234567'
      );
      expect(vendedorCall![0].mensaje).not.toContain('google.com/maps');
    });

    it('muestra tipo de pago correcto en los mensajes', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-wa-001' } as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({} as any);
      vi.mocked(whatsappService.send).mockResolvedValue({ key: { id: 'msg-001' } } as any);

      const data = makeReservationData({ tipoPago: 'CREDITO' });
      await NotificationService.sendReservationNotification(data);

      const vendedorCall = vi.mocked(whatsappService.send).mock.calls.find(
        (call) => call[0].numero === '9621234567'
      );
      expect(vendedorCall![0].mensaje).toContain('Crédito');

      const clienteCall = vi.mocked(whatsappService.send).mock.calls.find(
        (call) => call[0].numero === '9611234567'
      );
      expect(clienteCall![0].mensaje).toContain('Crédito');
    });
  });
});
