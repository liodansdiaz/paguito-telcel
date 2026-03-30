import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../shared/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { whatsappService } from '../shared/services/whatsapp.service';
import { logger } from '../shared/utils/logger';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('WhatsAppService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configurar variables de entorno para los tests
    process.env.EVOLUTION_API_URL = 'http://localhost:8080';
    process.env.EVOLUTION_API_KEY = 'test-api-key';
    process.env.EVOLUTION_INSTANCE_NAME = 'test-instance';
  });

  // ── send ───────────────────────────────────────────────────────────────────────
  describe('send', () => {
    it('envía mensaje correctamente con número normalizado', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          key: { remoteJid: '5219611234567@s.whatsapp.net', fromMe: true, id: 'msg-001' },
        }),
      });

      await whatsappService.send({
        numero: '9611234567',
        mensaje: 'Hola, tu reserva fue confirmada',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/message/sendText/test-instance',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'test-api-key',
          },
          body: JSON.stringify({
            number: '5219611234567',
            textMessage: { text: 'Hola, tu reserva fue confirmada' },
          }),
        })
      );
    });

    it('normaliza número con código de país +52', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: { id: 'msg-002' } }),
      });

      await whatsappService.send({
        numero: '+5219621234567',
        mensaje: 'Test',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.number).toBe('5219621234567');
    });

    it('normaliza número con 52 sin el 1', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: { id: 'msg-003' } }),
      });

      await whatsappService.send({
        numero: '529611234567',
        mensaje: 'Test',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.number).toBe('5219611234567');
    });

    it('normaliza número con espacios y guiones', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: { id: 'msg-004' } }),
      });

      await whatsappService.send({
        numero: '961 123 4567',
        mensaje: 'Test',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.number).toBe('5219611234567');
    });

    it('normaliza número con paréntesis', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: { id: 'msg-005' } }),
      });

      await whatsappService.send({
        numero: '(961) 123-4567',
        mensaje: 'Test',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.number).toBe('5219611234567');
    });

    it('lanza error si la API responde con status no OK', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(
        whatsappService.send({
          numero: '9611234567',
          mensaje: 'Test',
        })
      ).rejects.toThrow('Error al enviar WhatsApp: 500');
    });

    it('lanza error si la API responde 401 (no autorizado)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(
        whatsappService.send({
          numero: '9611234567',
          mensaje: 'Test',
        })
      ).rejects.toThrow('Error al enviar WhatsApp: 401');
    });

    it('loggea el envío exitoso', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          key: { id: 'msg-006', remoteJid: 'test', fromMe: true },
        }),
      });

      await whatsappService.send({
        numero: '9611234567',
        mensaje: 'Test',
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('WhatsApp enviado exitosamente'),
        expect.objectContaining({ messageId: 'msg-006' })
      );
    });
  });

  // ── verify ─────────────────────────────────────────────────────────────────────
  describe('verify', () => {
    it('devuelve true si la instancia está conectada', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          instance: { state: 'open' },
        }),
      });

      const result = await whatsappService.verify();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/instance/connectionState/test-instance',
        expect.objectContaining({
          method: 'GET',
          headers: { 'apikey': 'test-api-key' },
        })
      );
    });

    it('devuelve false si la instancia no está conectada', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          instance: { state: 'close' },
        }),
      });

      const result = await whatsappService.verify();

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('no conectada')
      );
    });

    it('devuelve false si la API no responde', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      });

      const result = await whatsappService.verify();

      expect(result).toBe(false);
    });

    it('devuelve false si fetch lanza error de red', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await whatsappService.verify();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Error verificando conexión con Evolution API:',
        expect.any(Error)
      );
    });
  });

  // ── validación de configuración ────────────────────────────────────────────────
  describe('validación de configuración', () => {
    it('lanza error si EVOLUTION_API_URL no está configurada', async () => {
      delete process.env.EVOLUTION_API_URL;

      await expect(
        whatsappService.send({ numero: '9611234567', mensaje: 'Test' })
      ).rejects.toThrow('EVOLUTION_API_URL');
    });

    it('lanza error si EVOLUTION_API_KEY no está configurada', async () => {
      delete process.env.EVOLUTION_API_KEY;

      await expect(
        whatsappService.send({ numero: '9611234567', mensaje: 'Test' })
      ).rejects.toThrow('EVOLUTION_API_KEY');
    });

    it('lanza error si EVOLUTION_INSTANCE_NAME no está configurada', async () => {
      delete process.env.EVOLUTION_INSTANCE_NAME;

      await expect(
        whatsappService.send({ numero: '9611234567', mensaje: 'Test' })
      ).rejects.toThrow('EVOLUTION_INSTANCE_NAME');
    });
  });
});
