import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import type { User } from '../../types';
import { showSuccess, showError } from '../../utils/notifications';
import AdminPageLayout from '../../components/admin/AdminPageLayout';

const createSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').or(z.literal('')),
  telefono: z.string().optional(),
});
type AdminForm = z.infer<typeof createSchema>;

const AdminsManager = () => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AdminForm>({
    resolver: zodResolver(createSchema),
  });

  const totalPages = Math.ceil(total / limit);

  const fetchAdmins = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { 
        rol: 'ADMIN',
        page: String(p),
        limit: String(l),
      };
      if (search) params.search = search;
      if (filterEstado) params.isActive = filterEstado;
      
      const res = await api.get('/admin/users', { params });
      setAdmins(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchAdmins(page, limit); 
  }, [page, limit, search, filterEstado]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = { rol: 'ADMIN', limit: '9999' };
      if (search) params.search = search;
      if (filterEstado) params.isActive = filterEstado;
      
      const res = await api.get('/admin/users', { params });
      const rows: User[] = res.data.data;

      const headers = ['Nombre', 'Email', 'Teléfono', 'Estado', 'Fecha registro', 'Último acceso'];
      const data = rows.map((a) => [
        a.nombre,
        a.email,
        a.telefono ?? '',
        a.isActive ? 'Activo' : 'Inactivo',
        new Date(a.createdAt).toLocaleDateString('es-MX'),
        a.lastAssignedAt ? new Date(a.lastAssignedAt).toLocaleDateString('es-MX') : 'Nunca',
      ]);

      const csv = [headers, ...data]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `administradores_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Administradores exportados correctamente');
    } catch (err) {
      console.error('Error al exportar:', err);
      showError('No se pudo exportar. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const openCreate = () => {
    setEditingAdmin(null);
    reset({ nombre: '', email: '', password: '', telefono: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (admin: User) => {
    setEditingAdmin(admin);
    reset({ nombre: admin.nombre, email: admin.email, password: '', telefono: admin.telefono ?? '' });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    reset();
    setFormError('');
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      showSuccess('Administrador actualizado correctamente');
      fetchAdmins(page, limit);
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al cambiar estado del administrador');
    }
  };

  const onSubmit = async (data: AdminForm) => {
    setFormError('');
    try {
      if (editingAdmin) {
        const payload: Record<string, string> = {
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono ?? '',
        };
        if (data.password) payload.password = data.password;
        await api.put(`/admin/users/${editingAdmin.id}`, payload);
        showSuccess('Administrador actualizado correctamente');
      } else {
        await api.post('/admin/users', { ...data, rol: 'ADMIN' });
        showSuccess('Administrador creado correctamente');
      }
      closeModal();
      fetchAdmins(page, limit);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      showSuccess('Administrador eliminado correctamente');
      setDeleteTarget(null);
      fetchAdmins(page, limit);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al eliminar administrador');
    } finally {
      setDeleting(false);
    }
  };

  const activos = admins.filter((a) => a.isActive).length;

  // Filtros UI
  const filtersUI = (
    <>
      <div className="w-36">
        <label className="text-xs text-gray-500 block mb-1">Estado</label>
        <select
          value={filterEstado}
          onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </>
  );

  return (
    <AdminPageLayout
      title="Administradores"
      subtitle={`${total} ${total === 1 ? 'administrador registrado' : 'administradores registrados'} • ${activos} ${activos === 1 ? 'activo' : 'activos'}`}
      actions={
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={exporting || admins.length === 0}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exportando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </>
            )}
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#0f49bd] text-white rounded-lg hover:bg-[#002f87] transition-colors text-sm font-medium flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Nuevo administrador
          </button>
        </div>
      }
    >
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-gray-500 block mb-1">Buscar</label>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Nombre o email..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {filtersUI}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-500 mt-2 text-sm">Cargando administradores...</p>
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay administradores</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo administrador.</p>
          <div className="mt-6">
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-[#0f49bd] text-white rounded-lg hover:bg-[#002f87] transition-colors text-sm font-medium"
            >
              + Nuevo administrador
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha registro
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {admin.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{admin.nombre}</div>
                            <div className="text-xs text-gray-500">ID: {admin.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.telefono || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggle(admin.id)}
                          className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            admin.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          } transition-colors`}
                        >
                          {admin.isActive ? '✓ Activo' : '✗ Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(admin.createdAt).toLocaleDateString('es-MX', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEdit(admin)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Página {page} de {totalPages} • {total} {total === 1 ? 'administrador' : 'administradores'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingAdmin ? 'Editar administrador' : 'Nuevo administrador'}
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  {...register('nombre')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Juan Pérez"
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@paguito.com"
                  disabled={!!editingAdmin}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                {editingAdmin && <p className="text-xs text-gray-500 mt-1">No se puede cambiar el email</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingAdmin ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña *'}
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={editingAdmin ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  {...register('telefono')}
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9621234567"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#0f49bd] text-white rounded-lg hover:bg-[#002f87] transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingAdmin ? 'Guardar cambios' : 'Crear administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Eliminar administrador</h2>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de eliminar a <strong>{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminsManager;
