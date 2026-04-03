import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';
import type { Product } from '../../types';
import { showSuccess, showError } from '../../utils/notifications';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import * as XLSX from 'xlsx';

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
  enganche: z.string().optional(),
  pagoSemanal: z.string().optional(),
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

   // ── Exportar a Excel ────────────────────────────────────────────────────────────
   const exportToExcel = async () => {
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
 
       // Procesar datos para Excel
       const excelData = rows.map((p) => ({
         'SKU': p.sku,
         'Nombre': p.nombre,
         'Marca': p.marca,
         'Precio': p.precio,
         'Precio Anterior': p.precioAnterior ?? '',
         'Stock': p.stock,
         'Stock Mínimo': p.stockMinimo,
         'Estado': p.isActive ? 'Activo' : 'Inactivo',
         'Crédito': p.disponibleCredito ? 'Sí' : 'No',
         'Enganche': p.enganche ?? '',
         'Pago Semanal': p.pagoSemanal ?? '',
         'Badge': p.badge ?? '',
         'Colores': p.colores?.join('; ') ?? '',
         'Memorias': p.memorias?.join('; ') ?? '',
         'Fecha Creación': new Date(p.createdAt).toLocaleDateString('es-MX'),
       }));
 
       // Crear hoja de trabajo
       const worksheet = XLSX.utils.json_to_sheet(excelData);
       const workbook = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
       
       // Generar archivo Excel
       const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
       const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
       const url = window.URL.createObjectURL(excelBlob);
       
       // Crear enlace de descarga
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
       document.body.appendChild(link);
       link.click();
       link.remove();
       
       // Liberar memoria
       window.URL.revokeObjectURL(url);
       
       showSuccess('Inventario exportado correctamente');
     } catch (err) {
       console.error('Error al exportar a Excel:', err);
       showError('No se pudo exportar a Excel. Intenta de nuevo.');
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
    setValue('enganche', product.enganche ?? '');
    setValue('pagoSemanal', product.pagoSemanal ?? '');
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setExistingImageUrls([]);
    setImageFiles([]);
    setSelectedColores([]);
    setSelectedMemorias([]);
    setEspecificaciones({});
    reset({
      sku: '',
      nombre: '',
      marca: '',
      descripcion: '',
      precio: 0,
      precioAnterior: undefined,
      stock: 0,
      stockMinimo: 5,
      badge: '',
      disponibleCredito: true,
      enganche: '',
      pagoSemanal: '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    reset({
      sku: '',
      nombre: '',
      marca: '',
      descripcion: '',
      precio: 0,
      precioAnterior: undefined,
      stock: 0,
      stockMinimo: 5,
      badge: '',
      disponibleCredito: true,
      enganche: '',
      pagoSemanal: '',
    });
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
        // Campos opcionales que pueden estar vacíos (los enviamos siempre en edición)
        if ((key === 'badge' || key === 'enganche' || key === 'pagoSemanal' || key === 'descripcion') && isEditing) {
          formData.append(key, value === undefined || value === null ? '' : String(value));
        } else if (key === 'precioAnterior' && isEditing) {
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
        // Siempre enviar imagenesExistentes, aunque sea un array vacío
        if (existingImageUrls.length > 0) {
          existingImageUrls.forEach((url) => formData.append('imagenesExistentes', url));
        } else {
          // Enviar un marcador para indicar que no hay imágenes existentes
          formData.append('imagenesExistentes', JSON.stringify([]));
        }
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
         onExport={exportToExcel}
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
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Stock *</label>
                  <input {...register('stock', { valueAsNumber: true })} type="number" min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Stock mínimo</label>
                  <input {...register('stockMinimo', { valueAsNumber: true })} type="number" min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Badge (opcional)</label>
                <input 
                  {...register('badge')}
                  type="text"
                  placeholder="Ej: Más Vendido, Oferta, Nuevo Ingreso"
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <p className="text-xs text-gray-500 mt-1">Etiqueta destacada que se mostrará en el producto</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Enganche (opcional)</label>
                <input 
                  {...register('enganche')}
                  type="text"
                  placeholder="Ej: Enganche desde $300 a $800, Desde $350"
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <p className="text-xs text-gray-500 mt-1">Texto descriptivo del enganche que se mostrará en el producto</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Pago semanal (opcional)</label>
                <input 
                  {...register('pagoSemanal')}
                  type="text"
                  placeholder="Ej: Desde $150 a $240/semana, $120/semana"
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <p className="text-xs text-gray-500 mt-1">Texto descriptivo de los pagos semanales que se mostrará en el producto</p>
              </div>

              {/* Selector de Colores */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Colores disponibles</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Negro', 'Blanco', 'Azul', 'Gris', 'Plata', 'Dorado', 'Rojo', 'Verde', 'Rosa', 'Morado', 'Titanio', 'Beige'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColores(prev =>
                          prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedColores.includes(color)
                          ? 'bg-[#0f49bd] text-white border-[#0f49bd]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#0f49bd]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{selectedColores.length} colores seleccionados</p>
              </div>

              {/* Selector de Memorias */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Capacidades de almacenamiento</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'].map((memoria) => (
                    <button
                      key={memoria}
                      type="button"
                      onClick={() => {
                        setSelectedMemorias(prev =>
                          prev.includes(memoria) ? prev.filter(m => m !== memoria) : [...prev, memoria]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedMemorias.includes(memoria)
                          ? 'bg-[#0f49bd] text-white border-[#0f49bd]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#0f49bd]'
                      }`}
                    >
                      {memoria}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{selectedMemorias.length} capacidades seleccionadas</p>
              </div>

              {/* Especificaciones Técnicas */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Especificaciones Técnicas</label>
                
                {/* Categorías disponibles para agregar */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">Selecciona una categoría para agregar:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Red', 'Pantalla', 'Memoria', 'Cámara', 'Procesador', 'Sistema Operativo', 'Conexiones Inalámbricas', 'Batería', 'Dimensiones', 'Peso'].map((categoria) => (
                      <button
                        key={categoria}
                        type="button"
                        onClick={() => {
                          if (!especificaciones[categoria]) {
                            setEspecificaciones(prev => ({ ...prev, [categoria]: '' }));
                          }
                        }}
                        disabled={!!especificaciones[categoria]}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          especificaciones[categoria]
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-[#0f49bd] border border-[#0f49bd] hover:bg-[#0f49bd] hover:text-white'
                        }`}
                      >
                        {especificaciones[categoria] ? '✓ ' : '+ '}{categoria}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Especificaciones agregadas */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {Object.entries(especificaciones).map(([key, value]) => {
                    // Obtener icono según la categoría
                    let icon = null;
                    const keyLower = key.toLowerCase();
                    
                    if (keyLower.includes('red')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                      );
                    } else if (keyLower.includes('pantalla')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      );
                    } else if (keyLower.includes('memoria')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      );
                    } else if (keyLower.includes('cámara') || keyLower.includes('camara')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                      );
                    } else if (keyLower.includes('procesador') || keyLower.includes('cpu')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      );
                    } else if (keyLower.includes('sistema')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      );
                    } else if (keyLower.includes('conexi') || keyLower.includes('inalám')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0" />
                        </svg>
                      );
                    } else if (keyLower.includes('bater')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v1m0 16v1m9-9h1M3 12h1m13.28-7.636l.707.707M5.636 5.636l.707.707m12.02 12.02l.707.707M5.636 18.364l.707.707M17 12a5 5 0 11-10 0 5 5 0 0110 0z" />
                        </svg>
                      );
                    } else if (keyLower.includes('dimension')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      );
                    } else if (keyLower.includes('peso')) {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      );
                    } else {
                      icon = (
                        <svg className="w-5 h-5 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      );
                    }

                    return (
                      <div key={key} className="flex gap-2 items-start p-3 bg-white border border-gray-200 rounded-lg hover:border-[#0f49bd] transition-colors">
                        <div className="flex-shrink-0 mt-0.5">
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs font-semibold text-gray-700 block mb-1">{key}</label>
                          <textarea
                            value={value}
                            onChange={(e) => setEspecificaciones(prev => ({ ...prev, [key]: e.target.value }))}
                            placeholder={`Ej: ${
                              keyLower.includes('red') ? '5G' :
                              keyLower.includes('pantalla') ? '6.8"' :
                              keyLower.includes('memoria') ? 'Total: 1TB' :
                              keyLower.includes('cámara') ? 'Frontal: 12MP\nTrasera: 200MP' :
                              keyLower.includes('procesador') ? 'Snapdragon 8 Gen 2' :
                              keyLower.includes('sistema') ? 'Android 14' :
                              keyLower.includes('conexi') ? 'Wi-Fi\nUSB\nBluetooth' :
                              keyLower.includes('bater') ? 'Duración: 27 horas' :
                              keyLower.includes('dimension') ? '162.3 x 79 x 8.6 mm' :
                              keyLower.includes('peso') ? '233 gramos' :
                              'Valor de la especificación'
                            }`}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setEspecificaciones(prev => {
                            const updated = { ...prev };
                            delete updated[key];
                            return updated;
                          })}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {Object.keys(especificaciones).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Selecciona una categoría arriba para comenzar</p>
                )}
                
                <p className="text-xs text-gray-500 mt-3 px-1">
                  💡 Tip: Usa saltos de línea para listas (Ej: Cámara → "Frontal: 12MP" + Enter + "Trasera: 200MP")
                </p>
              </div>

              {/* Imágenes del producto */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Imágenes del producto (máx. 3)</label>
                
                {/* Imágenes existentes */}
                {existingImageUrls.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Imágenes actuales:</p>
                    <div className="flex flex-wrap gap-2">
                      {existingImageUrls.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img src={toImageUrl(url)} alt={`Imagen ${idx + 1}`} className="w-16 h-16 object-contain rounded-lg border border-gray-200" />
                          <button
                            type="button"
                            onClick={() => setExistingImageUrls(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar imagen"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nuevas imágenes */}
                {imageFiles.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Nuevas imágenes:</p>
                    <div className="flex flex-wrap gap-2">
                      {imageFiles.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <img src={URL.createObjectURL(file)} alt={`Nueva ${idx + 1}`} className="w-16 h-16 object-contain rounded-lg border border-gray-200" />
                          <button
                            type="button"
                            onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar imagen"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input para subir imágenes */}
                {(existingImageUrls.length + imageFiles.length) < 3 && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const remaining = 3 - existingImageUrls.length - imageFiles.length;
                        setImageFiles(prev => [...prev, ...files.slice(0, remaining)]);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#0f49bd] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-600">Click para seleccionar imágenes</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP (máx. 5MB c/u)</p>
                    </div>
                  </label>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {existingImageUrls.length + imageFiles.length} de 3 imágenes
                </p>
              </div>
              
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
