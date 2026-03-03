import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import type { User } from '../../types';

const createSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  zona: z.string().optional(),
  telefono: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const VendorsManager = () => {
  const [vendors, setVendors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { rol: 'VENDEDOR' } });
      setVendors(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      fetchVendors();
    } catch (err: any) { alert(err.response?.data?.message || 'Error'); }
  };

  const onSubmit = async (data: CreateForm) => {
    setCreateError('');
    try {
      await api.post('/admin/users', { ...data, rol: 'VENDEDOR' });
      setShowCreate(false);
      reset();
      fetchVendors();
    } catch (err: any) { setCreateError(err.response?.data?.message || 'Error al crear'); }
  };

  const activos = vendors.filter((v) => v.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Vendedores</h2>
          <p className="text-gray-400 text-sm">{activos} activos / {vendors.length} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-[#0f49bd] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
          + Nuevo vendedor
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse shadow-sm h-40" />
        )) : vendors.map((v) => (
          <div key={v.id} className={`bg-white rounded-xl shadow-sm border p-5 ${v.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${v.isActive ? 'bg-[#0f49bd]' : 'bg-gray-300'}`}>
                  {v.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{v.nombre}</p>
                  <p className="text-gray-400 text-xs">{v.email}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {v.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="text-xs text-gray-500 space-y-1 mb-3">
              {v.zona && <p>Zona: {v.zona}</p>}
              {v.telefono && <p>Tel: {v.telefono}</p>}
              <p>Reservas: {v._count?.reservations ?? 0}</p>
            </div>
            <button
              onClick={() => handleToggle(v.id)}
              className={`w-full text-xs py-1.5 rounded-lg font-medium transition-colors ${v.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
            >
              {v.isActive ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>

      {/* Modal crear vendedor */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-5">Nuevo Vendedor</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre completo</label>
                <input {...register('nombre')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Contraseña</label>
                <input {...register('password')} type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Zona</label>
                  <input {...register('zona')} placeholder="Ej: Centro" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
                  <input {...register('telefono')} type="tel" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {createError && <p className="text-red-500 text-sm">{createError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); reset(); setCreateError(''); }} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700">
                  {isSubmitting ? 'Creando...' : 'Crear vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsManager;
