import { z } from 'zod';
import { isValidCURP, isValidPhoneMX, formatCURP, cleanPhoneMX, validationMessages } from '../../shared/utils/validators';

/**
 * DTO para un item del carrito
 */
export const reservationItemSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  color: z.string().optional(),
  memoria: z.string().optional(),
  tipoPago: z.enum(['CONTADO', 'CREDITO']),
});

export type ReservationItemDTO = z.infer<typeof reservationItemSchema>;

/**
 * DTO para crear una reserva con carrito multi-producto
 */
export const createReservationSchema = z.object({
  items: z.array(reservationItemSchema).min(1, 'Debes agregar al menos un producto'),
  nombreCompleto: z.string().min(3, 'Nombre completo requerido'),
  telefono: z.string()
    .min(1, validationMessages.phone.required)
    .transform((val) => cleanPhoneMX(val))
    .refine((val) => isValidPhoneMX(val), {
      message: validationMessages.phone.invalid,
    }),
  // CURP opcional - solo requerida si hay productos a crédito
  curp: z.string()
    .optional()
    .transform((val) => (val ? formatCURP(val) : undefined))
    .refine((val) => !val || val.length === 18, {
      message: validationMessages.curp.length,
    })
    .refine((val) => !val || isValidCURP(val), {
      message: validationMessages.curp.invalid,
    }),
  direccion: z.string().min(10, 'Dirección completa requerida'),
  fechaPreferida: z.string().transform((val) => new Date(val)),
  horarioPreferido: z.string().regex(/^\d{1,2}:\d{2}$/, 'Formato de horario inválido (HH:MM)'),
  latitude: z.number().min(-90).max(90, 'Latitud inválida').nullable().optional(),
  longitude: z.number().min(-180).max(180, 'Longitud inválida').nullable().optional(),
  notas: z.string().optional(),
});

export type CreateReservationDTO = z.infer<typeof createReservationSchema>;

/**
 * DTO para consulta de reserva por folio o CURP
 */
export const consultaReservaSchema = z.object({
  busqueda: z.string().min(8, 'Folio o CURP requerido'),
});

export type ConsultaReservaDTO = z.infer<typeof consultaReservaSchema>;

/**
 * DTO para cancelar reserva
 */
export const cancelarReservaSchema = z.object({
  busqueda: z.string().min(8, 'Folio o CURP requerido'),
  itemId: z.string().uuid().optional(),
});

export type CancelarReservaDTO = z.infer<typeof cancelarReservaSchema>;

/**
 * DTO para modificar reserva
 */
export const modificarReservaSchema = z.object({
  busqueda: z.string().min(8, 'Folio o CURP requerido'),
  fechaPreferida: z.string().transform((val) => new Date(val)).optional(),
  horarioPreferido: z.string().regex(/^\d{1,2}:\d{2}$/, 'Formato de horario inválido (HH:MM)').optional(),
  direccion: z.string().min(10, 'Dirección completa requerida').optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export type ModificarReservaDTO = z.infer<typeof modificarReservaSchema>;

/**
 * DTO para actualizar estado de reserva (admin)
 */
export const updateStatusSchema = z.object({
  estado: z.enum(['NUEVA', 'ASIGNADA', 'EN_VISITA', 'COMPLETADA', 'CANCELADA', 'PARCIAL']),
  notas: z.string().optional(),
});

export type UpdateStatusDTO = z.infer<typeof updateStatusSchema>;

/**
 * DTO para asignar vendor
 */
export const assignVendorSchema = z.object({
  vendorId: z.string().uuid(),
});

export type AssignVendorDTO = z.infer<typeof assignVendorSchema>;

/**
 * DTO para cambiar estado de item
 */
export const updateItemStatusSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'VENDIDO', 'NO_CONCRETADO', 'CANCELADO']),
  notas: z.string().optional(),
});

export type UpdateItemStatusDTO = z.infer<typeof updateItemStatusSchema>;