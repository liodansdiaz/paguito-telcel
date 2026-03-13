import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import type { User } from '../../types';
import { showSuccess, showError } from '../../utils/notifications';

// ── Exportar vendedores a CSV ───────────────────────────────────────────────────
const exportCSV = async () => {
  try {
    const params: Record<string, string> = { rol: 'VENDEDOR' };
    const res = await api.get('/admin/users', { params });
    const rows: User[] = res.data.data;

    const headers = ['Nombre', 'Email', 'Zona', 'Teléfono', 'Estado', 'Fecha registro'];
    const data = rows.map((v) => [
      v.nombre,
      v.email,
      v.zona ?? '',
      v.telefono ?? '',
      v.isActive ? 'Activo' : 'Inactivo',
      new Date(v.createdAt).toLocaleDateString('es-MX'),
    ]);

    const csv = [headers, ...data]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendedores_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Vendedores exportados correctamente');
  } catch (err) {
    console.error('Error al exportar:', err);
    showError('No se pudo exportar. Intenta de nuevo.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────

const createSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').or(z.literal('')),
  zona: z.string().optional(),
  telefono: z.string().optional(),
});
type VendorForm = z.infer<typeof createSchema>;

const VendorsManager = () => {
  const [vendors, setVendors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<User | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<VendorForm>({
    resolver: zodResolver(createSchema),
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { rol: 'VENDEDOR' } });
      setVendors(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, []);

  const openCreate = () => {
    setEditingVendor(null);
    reset({ nombre: '', email: '', password: '', zona: '', telefono: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (vendor: User) => {
    setEditingVendor(vendor);
    reset({ nombre: vendor.nombre, email: vendor.email, password: '', zona: vendor.zona ?? '', telefono: vendor.telefono ?? '' });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    reset();
    setFormError('');
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      showSuccess('Vendedor actualizado correctamente');
      fetchVendors();
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al cambiar estado del vendedor');
    }
  };

  const onSubmit = async (data: VendorForm) => {
    setFormError('');
    try {
      if (editingVendor) {
        const payload: Record<string, string> = {
          nombre: data.nombre,
          email: data.email,
          zona: data.zona ?? '',
          telefono: data.telefono ?? '',
        };
        if (data.password) payload.password = data.password;
        await api.put(`/admin/users/${editingVendor.id}`, payload);
        showSuccess('Vendedor actualizado correctamente');
      } else {
        await api.post('/admin/users', { ...data, rol: 'VENDEDOR' });
        showSuccess('Vendedor creado correctamente');
      }
      closeModal();
      fetchVendors();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      showSuccess('Vendedor eliminado correctamente');
      setDeleteTarget(null);
      fetchVendors();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al eliminar vendedor');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    await exportCSV();
    setExporting(false);
  };

  const activos = vendors.filter((v) => v.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Vendedores</h2>
          <p className="text-gray-400 text-sm">{activos} activos / {vendors.length} total</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleExport}
            disabled={exporting || vendors.length === 0}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            title="Exportar a CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exportando...' : 'CSV'}
          </button>
          <button onClick={openCreate} className="bg-[#0f49bd] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            + Nuevo vendedor
          </button>
        </div>
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
            {/* Acciones */}
            <div className="flex gap-2">
              <button
                onClick={() => handleToggle(v.id)}
                title={v.isActive ? 'Desactivar' : 'Activar'}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${v.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
              >
                {v.isActive ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => openEdit(v)}
                title="Editar vendedor"
                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                {/* Ícono lápiz */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                </svg>
              </button>
              <button
                onClick={() => setDeleteTarget(v)}
                title="Eliminar vendedor"
                className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              >
                {/* Ícono papelera */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal crear / editar vendedor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-5">
              {editingVendor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h3>
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
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contraseña {editingVendor && <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input {...register('password')} type="password" placeholder={editingVendor ? '••••••••' : ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700">
                  {isSubmitting ? 'Guardando...' : editingVendor ? 'Guardar cambios' : 'Crear vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Eliminar vendedor</h3>
            <p className="text-gray-500 text-sm mb-6">
              ¿Estás seguro de eliminar a <span className="font-semibold text-gray-900">{deleteTarget.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsManager;
