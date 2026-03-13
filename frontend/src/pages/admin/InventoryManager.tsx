import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';
import type { Product } from '../../types';
import { showSuccess, showError } from '../../utils/notifications';
import AdminPageLayout from '../../components/admin/AdminPageLayout';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  marca: z.string().min(1, 'Marca requerida'),
  descripcion: z.string().optional(),
  precio: z.number().positive('Precio debe ser positivo'),
  precioAnterior: z.any().optional(),
  stock: z.number().int().min(0),
  stockMinimo: z.number().int().min(0).optional(),
  badge: z.string().optional(),
  disponibleCredito: z.boolean().optional(),
  pagosSemanales: z.number().positive().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

const getStockBadge = (stock: number, min: number) => {
  if (stock === 0) return { label: 'Sin stock', cls: 'bg-red-100 text-red-700' };
  if (stock <= min) return { label: 'Crítico', cls: 'bg-orange-100 text-orange-700' };
  if (stock <= min * 3) return { label: 'Bajo', cls: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Normal', cls: 'bg-green-100 text-green-700' };
};

const InventoryManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [limit, setLimit] = useState(15);
  const [page, setPage] = useState(1);

  // Filtros de búsqueda avanzada
  const [search, setSearch] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedMemoria, setSelectedMemoria] = useState('');
  const [precioMin, setPrecioMin] = useState<number | undefined>(undefined);
  const [precioMax, setPrecioMax] = useState<number | undefined>(undefined);

  // Opciones dinámicas para filtros
  const [marcas, setMarcas] = useState<string[]>([]);
  const [colores, setColores] = useState<string[]>([]);

  // Modal crear/editar
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [selectedColores, setSelectedColores] = useState<string[]>([]);
  const [selectedMemorias, setSelectedMemorias] = useState<string[]>([]);
  const [especificaciones, setEspecificaciones] = useState<Record<string, string>>({});

  // Modal eliminar
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const totalPages = Math.ceil(total / limit);
  const isEditing = editingProduct !== null;

  const fetchProducts = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(l), page: String(p), sort: 'reciente' };
      if (search) params.search = search;
      if (selectedMarca) params.marca = selectedMarca;
      if (selectedColor) params.color = selectedColor;
      if (selectedMemoria) params.memoria = selectedMemoria;
      if (precioMin !== undefined) params.precioMin = String(precioMin);
      if (precioMax !== undefined) params.precioMax = String(precioMax);
      
      const res = await api.get('/products/admin/list', { params });
      setProducts(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    setPage(1); 
    fetchProducts(1, limit); 
  }, [limit, search, selectedMarca, selectedColor, selectedMemoria, precioMin, precioMax]);

  // Obtener opciones dinámicas para filtros
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [marcasRes, coloresRes] = await Promise.all([
          api.get('/products/marcas'),
          api.get('/products/colores'),
        ]);
        setMarcas(marcasRes.data.data || []);
        setColores(coloresRes.data.data || []);
      } catch (err) {
        console.error('Error al cargar opciones de filtros:', err);
      }
    };
    fetchOptions();
  }, []);

  // ── Exportar a CSV ────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = { page: '1', limit: '9999', sort: 'reciente' };
      if (search) params.search = search;
      if (selectedMarca) params.marca = selectedMarca;
      if (selectedColor) params.color = selectedColor;
      if (selectedMemoria) params.memoria = selectedMemoria;
      if (precioMin !== undefined) params.precioMin = String(precioMin);
      if (precioMax !== undefined) params.precioMax = String(precioMax);
      
      const res = await api.get('/products/admin/list', { params });
      const rows: Product[] = res.data.data;

      const headers = ['SKU', 'Nombre', 'Marca', 'Precio', 'Precio Anterior', 'Stock', 'Stock Mínimo', 'Estado', 'Crédito', 'Pagos Semanales', 'Badge', 'Colores', 'Memorias', 'Fecha Creación'];
      const data = rows.map((p) => [
        p.sku,
        p.nombre,
        p.marca,
        p.precio,
        p.precioAnterior ?? '',
        p.stock,
        p.stockMinimo,
        p.isActive ? 'Activo' : 'Inactivo',
        p.disponibleCredito ? 'Sí' : 'No',
        p.pagosSemanales ?? '',
        p.badge ?? '',
        p.colores?.join('; ') ?? '',
        p.memorias?.join('; ') ?? '',
        new Date(p.createdAt).toLocaleDateString('es-MX'),
      ]);

      const csv = [headers, ...data]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Inventario exportado correctamente');
    } catch (err) {
      console.error('Error al exportar:', err);
      showError('No se pudo exportar. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setExistingImageUrls(product.imagenes ?? []);
    setImageFiles([]);
    setSelectedColores(product.colores ?? []);
    setSelectedMemorias(product.memorias ?? []);
    setEspecificaciones(
      product.especificaciones
        ? Object.fromEntries(Object.entries(product.especificaciones).map(([k, v]) => [k, String(v)]))
        : {}
    );
    setValue('sku', product.sku);
    setValue('nombre', product.nombre);
    setValue('marca', product.marca);
    setValue('descripcion', product.descripcion ?? '');
    setValue('precio', product.precio);
    setValue('precioAnterior', product.precioAnterior ?? undefined);
    setValue('stock', product.stock);
    setValue('stockMinimo', product.stockMinimo);
    setValue('badge', product.badge ?? '');
    setValue('disponibleCredito', product.disponibleCredito);
    setValue('pagosSemanales', product.pagosSemanales ?? undefined);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setExistingImageUrls([]);
    setImageFiles([]);
    setSelectedColores([]);
    setSelectedMemorias([]);
    setEspecificaciones({});
    reset();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    reset();
    setImageFiles([]);
    setExistingImageUrls([]);
    setSelectedColores([]);
    setSelectedMemorias([]);
    setEspecificaciones({});
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        const isEmpty = value === undefined || value === null || (typeof value === 'number' && isNaN(value));
        if (key === 'precioAnterior' && isEditing) {
          formData.append(key, isEmpty ? '' : String(value));
        } else if (!isEmpty && value !== '') {
          formData.append(key, String(value));
        }
      });
      imageFiles.forEach((file) => formData.append('imagenes', file));
      formData.append('colores', JSON.stringify(selectedColores));
      formData.append('memorias', JSON.stringify(selectedMemorias));
      if (Object.keys(especificaciones).length > 0) {
        formData.append('especificaciones', JSON.stringify(especificaciones));
      }

      if (isEditing) {
        existingImageUrls.forEach((url) => formData.append('imagenesExistentes', url));
        await api.put(`/products/admin/${editingProduct!.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/products/admin', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      showSuccess(isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
      closeForm();
      fetchProducts(page, limit);
    } catch (err: any) { showError(err.response?.data?.message || 'Error al guardar'); }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/products/admin/${id}/toggle`);
      showSuccess('Producto actualizado correctamente');
      fetchProducts(page, limit);
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al cambiar estado del producto');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/products/admin/${deleteTarget.id}`);
      showSuccess('Producto eliminado correctamente');
      setDeleteTarget(null);
      fetchProducts(page, limit);
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al eliminar producto');
    }
    finally { setDeleting(false); }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(p);

  // Filtros UI
  const filtersUI = (
    <>
      <div className="w-40">
        <label className="text-xs text-gray-500 block mb-1">Marca</label>
        <select
          value={selectedMarca}
          onChange={(e) => setSelectedMarca(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="w-32">
        <label className="text-xs text-gray-500 block mb-1">Color</label>
        <select
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          {colores.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="w-32">
        <label className="text-xs text-gray-500 block mb-1">Memoria</label>
        <select
          value={selectedMemoria}
          onChange={(e) => setSelectedMemoria(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          {['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="w-48">
        <label className="text-xs text-gray-500 block mb-1">Precio</label>
        <div className="flex gap-1 items-center">
          <input
            type="number"
            placeholder="Mín"
            value={precioMin ?? ''}
            onChange={(e) => setPrecioMin(e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">-</span>
          <input
            type="number"
            placeholder="Máx"
            value={precioMax ?? ''}
            onChange={(e) => setPrecioMax(e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
  );

  const activeFiltersUI = (
    <>
      {search && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Búsqueda: "{search}"
          <button onClick={() => setSearch('')} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
      {selectedMarca && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Marca: {selectedMarca}
          <button onClick={() => setSelectedMarca('')} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
      {selectedColor && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Color: {selectedColor}
          <button onClick={() => setSelectedColor('')} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
      {selectedMemoria && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Memoria: {selectedMemoria}
          <button onClick={() => setSelectedMemoria('')} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
      {precioMin !== undefined && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Precio min: ${precioMin}
          <button onClick={() => setPrecioMin(undefined)} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
      {precioMax !== undefined && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Precio max: ${precioMax}
          <button onClick={() => setPrecioMax(undefined)} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
    </>
  );

  return (
    <>
      <AdminPageLayout
        title="Inventario y Stock"
        subtitle={`${total} productos · página ${page} de ${totalPages || 1}`}
        total={total}
        page={page}
        totalPages={totalPages}
        limit={limit}
        loading={loading}
        exporting={exporting}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onExport={exportCSV}
        onAdd={openCreate}
        addButtonText="+ Agregar producto"
        searchPlaceholder="Buscar por SKU, nombre o marca..."
        searchValue={search}
        onSearchChange={setSearch}
        onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
        filters={filtersUI}
        activeFilters={activeFiltersUI}
      >
        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Imagen', 'SKU', 'Producto', 'Marca', 'Precio', 'Stock', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Sin productos</td></tr>
              ) : (
                products.map((p) => {
                  const sb = getStockBadge(p.stock, p.stockMinimo);
                  const img = p.imagenes?.length ? toImageUrl(p.imagenes[0]) : null;
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        {img
                          ? <img src={img} alt={p.nombre} className="w-10 h-10 object-contain rounded bg-gray-50" />
                          : <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-lg">📱</div>
                        }
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 whitespace-nowrap">{p.nombre}</p>
                        {p.badge && <span className="text-xs bg-[#13ec6d] text-[#002f87] px-1.5 py-0.5 rounded font-medium">{p.badge}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.marca}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatPrice(p.precio)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-gray-900 mr-2">{p.stock}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sb.cls}`}>{sb.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} title="Editar producto"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button onClick={() => handleToggle(p.id)} title={p.isActive ? 'Desactivar' : 'Activar'}
                            className={`p-1.5 rounded-lg transition-colors ${p.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              {p.isActive
                                ? <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="16" cy="12" r="3" fill="currentColor" /></>
                                : <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="8" cy="12" r="3" fill="currentColor" /></>
                              }
                            </svg>
                          </button>
                          <button onClick={() => setDeleteTarget(p)} title="Eliminar producto"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminPageLayout>

      {/* Modal crear / editar producto */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 my-4">
            <h3 className="font-bold text-lg text-gray-900 mb-5">
              {isEditing ? `Editar: ${editingProduct!.nombre}` : 'Agregar Producto'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">SKU *</label>
                  <input {...register('sku')} disabled={isEditing}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="APL-14PM-256" />
                  {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre del celular *</label>
                  <input {...register('nombre')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="iPhone 14 Pro Max 256GB" />
                  {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Marca *</label>
                <input {...register('marca')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Apple / Samsung / Motorola..." />
                {errors.marca && <p className="text-red-500 text-xs mt-1">{errors.marca.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
                <textarea {...register('descripcion')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Precio contado * ($)</label>
                  <input {...register('precio', { valueAsNumber: true })} type="number" step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.precio && <p className="text-red-500 text-xs mt-1">{errors.precio.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Precio anterior ($)</label>
                  <input {...register('precioAnterior', { valueAsNumber: true })} type="number" step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Stock *</label>
                  <input {...register('stock', { valueAsNumber: true })} type="number" min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Stock mínimo</label>
                  <input {...register('stockMinimo', { valueAsNumber: true })} type="number" min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Pagos/semana ($)</label>
                  <input {...register('pagosSemanales', { valueAsNumber: true })} type="number" step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Badge (opcional)</label>
                <input {...register('badge')} placeholder="Más Vendido / Oferta / Nuevo Ingreso"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              
              {/* ImageUploader component would go here */}
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700">
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">¿Eliminar producto?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Se eliminará <strong>{deleteTarget.nombre}</strong> permanentemente. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryManager;
