import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSendMail, mockVerify } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockVerify: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
      verify: mockVerify,
    })),
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

import { emailService } from '../shared/services/email.service';

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── send ───────────────────────────────────────────────────────────────────────
  describe('send', () => {
    it('envía email correctamente', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'msg-001' });

      await emailService.send({
        to: 'vendor@paguito.com',
        subject: 'Nueva Reserva',
        html: '<p>Hola</p>',
        text: 'Hola',
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: 'vendor@paguito.com',
        subject: 'Nueva Reserva',
        html: '<p>Hola</p>',
        text: 'Hola',
      });
    });

    it('lanza error si falla el envío', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

      await expect(
        emailService.send({
          to: 'vendor@paguito.com',
          subject: 'Error',
          html: '<p>Error</p>',
        })
      ).rejects.toThrow('SMTP connection failed');
    });
  });

  // ── verify ─────────────────────────────────────────────────────────────────────
  describe('verify', () => {
    it('devuelve true si conexión es válida', async () => {
      mockVerify.mockResolvedValue(true);

      const result = await emailService.verify();

      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalledOnce();
    });

    it('devuelve false si conexión falla', async () => {
      mockVerify.mockRejectedValue(new Error('Connection refused'));

      const result = await emailService.verify();

      expect(result).toBe(false);
    });
  });
});
