import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import type { Product } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { validateSchedule, getMinTime, getMaxTime } from '../../hooks/useScheduleValidator';

const schema = z.object({
  nombreCompleto: z.string().min(3, 'Nombre requerido'),
  telefono: z.string().min(10).max(15),
  curp: z.string().length(18, 'CURP debe tener 18 caracteres'),
  tipoPago: z.enum(['CONTADO', 'CREDITO']),
  direccion: z.string().min(10, 'Direccion completa requerida'),
  fechaPreferida: z.string().min(1, 'Selecciona una fecha'),
  horarioPreferido: z.string().min(1, 'Selecciona un horario'),
});
type FormData = z.infer<typeof schema>;
const fmt = (p: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(p);
const ReservationForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null as Product | null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const geo = useGeolocation();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { tipoPago: 'CONTADO' as const } });
  const watchedDate = watch('fechaPreferida');
  const watchedTime = watch('horarioPreferido');
  useEffect(() => {
    if (!productId) return;
    api.get('/products/' + productId).then((r: any) => setProduct(r.data.data)).catch(() => navigate('/catalogo')).finally(() => setLoading(false));
  }, [productId]);
  useEffect(() => {
    if (watchedDate && watchedTime) {
      const v = validateSchedule(watchedDate, watchedTime);
      setScheduleError(v.isValid ? '' : (v.message || ''));
    }
  }, [watchedDate, watchedTime]);
  const onSubmit = async (data: FormData) => {
    if (!geo.obtained || geo.latitude === null || geo.longitude === null) return;
    if (scheduleError) return;
    const v = validateSchedule(data.fechaPreferida, data.horarioPreferido);
    if (!v.isValid) { setScheduleError(v.message || ''); return; }
    setSubmitting(true); setSubmitError('');
    try {
      const res: any = await api.post('/reservations', { productId, ...data, curp: data.curp.toUpperCase(), fechaPreferida: new Date(data.fechaPreferida + 'T00:00:00').toISOString(), latitude: geo.latitude, longitude: geo.longitude });
      navigate('/reserva/exitosa', { state: { reservationId: res.data.data.id, producto: product?.nombre, nombre: data.nombreCompleto } });
    } catch (err: any) { setSubmitError(err.response?.data?.message || 'Error al crear la reserva.'); }
    finally { setSubmitting(false); }
  };
  if (loading) return <div className='flex items-center justify-center min-h-96'><div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' /></div>;
  if (!product) return null;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  return (
    <div className='max-w-2xl mx-auto px-4 py-10'>
      <h1 className='text-2xl font-bold text-gray-900 mb-1'>Reservar celular</h1>
      <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center gap-4'>
        {product.imagenUrl ? <img src={product.imagenUrl} alt={product.nombre} className='w-14 h-14 object-contain' /> : <span className='text-3xl'>📱</span>}
        <div>
          <p className='text-xs text-blue-500 font-medium'>{product.marca}</p>
          <p className='font-bold text-gray-900'>{product.nombre}</p>
          <p className='text-[#0f49bd] font-semibold text-sm'>{fmt(product.precio)} al contado</p>
          {product.disponibleCredito && product.pagosSemanales && <p className='text-gray-400 text-xs'>o desde {fmt(product.pagosSemanales)}/semana a credito</p>}
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Nombre completo *</label>
          <input {...register('nombreCompleto')} className='w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm' placeholder='Tu nombre completo' />
          {errors.nombreCompleto && <p className='text-red-500 text-xs mt-1'>{errors.nombreCompleto.message}</p>}
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Telefono *</label>
            <input {...register('telefono')} type='tel' className='w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm' placeholder='55 1234 5678' />
            {errors.telefono && <p className='text-red-500 text-xs mt-1'>{errors.telefono.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>CURP *</label>
            <input {...register('curp')} className='w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm uppercase' placeholder='XXXX000000XXXXXX00' maxLength={18} />
            {errors.curp && <p className='text-red-500 text-xs mt-1'>{errors.curp.message}</p>}
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Tipo de pago *</label>
          <div className='flex gap-4'>
            {(['CONTADO', 'CREDITO'] as const).map((t) => (
              <label key={t} className='flex items-center gap-2 cursor-pointer'>
                <input {...register('tipoPago')} type='radio' value={t} className='w-4 h-4' />
                <span className='text-sm text-gray-700'>{t === 'CONTADO' ? 'Contado' : 'Credito'}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Direccion completa *</label>
          <textarea {...register('direccion')} rows={3} className='w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm' placeholder='Calle, numero, colonia, ciudad, estado' />
          {errors.direccion && <p className='text-red-500 text-xs mt-1'>{errors.direccion.message}</p>}
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Fecha preferida *</label>
            <input {...register('fechaPreferida')} type='date' min={minDate} className='w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm' />
            {errors.fechaPreferida && <p className='text-red-500 text-xs mt-1'>{errors.fechaPreferida.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Horario preferido *</label>
            <input {...register('horarioPreferido')} type='time' min={getMinTime(watchedDate)} max={getMaxTime(watchedDate)} className='w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm' />
            {errors.horarioPreferido && <p className='text-red-500 text-xs mt-1'>{errors.horarioPreferido.message}</p>}
          </div>
        </div>
        <div className='bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700'>
          Horarios: Lunes-Viernes 9:30-16:30 | Sabados 9:30-14:30 | Domingos no disponible
        </div>
        {scheduleError && <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700'>⚠️ {scheduleError}</div>}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Ubicacion GPS *</label>
          <p className='text-xs text-gray-500 mb-3'>Necesitamos tu ubicacion para la visita. Obligatoria.</p>
          {!geo.obtained ? (
            <button type='button' onClick={geo.requestLocation} disabled={geo.loading} className={'w-full border-2 border-dashed rounded-xl py-4 text-sm font-semibold flex items-center justify-center gap-2 ' + (geo.loading ? 'border-gray-300 text-gray-400' : 'border-[#0f49bd] text-[#0f49bd] hover:bg-blue-50')}>
              {geo.loading ? 'Obteniendo ubicacion...' : '📍 Enviar mi ubicacion'}
            </button>
          ) : (
            <div className='bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between gap-3'>
              <div>
                <p className='text-green-700 font-semibold text-sm'>✅ Ubicacion capturada</p>
                <p className='text-green-600 text-xs mt-1'>Lat: {geo.latitude?.toFixed(6)} | Lon: {geo.longitude?.toFixed(6)}</p>
              </div>
              <button type='button' onClick={geo.reset} className='text-xs text-gray-400 hover:text-gray-600 underline'>Cambiar</button>
            </div>
          )}
          {geo.error && <div className='mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700'>⚠️ {geo.error}</div>}
        </div>
        {submitError && <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700'>❌ {submitError}</div>}
        <button type='submit' disabled={submitting || !geo.obtained || !!scheduleError} className={'w-full py-4 rounded-xl font-bold text-base transition-all ' + (submitting || !geo.obtained || !!scheduleError ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#13ec6d] text-[#002f87] hover:bg-green-400')}>
          {submitting ? 'Enviando...' : !geo.obtained ? 'Primero envia tu ubicacion GPS' : 'Confirmar reserva'}
        </button>
      </form>
    </div>
  );
};
export default ReservationForm;