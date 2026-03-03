import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import type { Product } from '../../types';

const BACKEND_URL = 'http://localhost:3000';

const createSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  marca: z.string().min(1, 'Marca requerida'),
  descripcion: z.string().optional(),
  precio: z.number().positive('Precio debe ser positivo'),
  precioAnterior: z.number().positive().optional().or(z.literal(undefined)),
  stock: z.number().int().min(0),
  stockMinimo: z.number().int().min(0).optional(),
  badge: z.string().optional(),
  disponibleCredito: z.boolean().optional(),
  pagosSemanales: z.number().positive().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const MAX_IMAGES = 3;

const getStockBadge = (stock: number, min: number) => {
  if (stock === 0) return { label: 'Sin stock', cls: 'bg-red-100 text-red-700' };
  if (stock <= min) return { label: 'Crítico', cls: 'bg-orange-100 text-orange-700' };
  if (stock <= min * 3) return { label: 'Bajo', cls: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Normal', cls: 'bg-green-100 text-green-700' };
};

// Convierte una ruta relativa del backend en URL completa
const toImageUrl = (src: string) =>
  src.startsWith('http') ? src : `${BACKEND_URL}${src}`;

// Componente selector de imágenes con preview
const ImageUploader = ({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const combined = [...files, ...selected].slice(0, MAX_IMAGES);
    onChange(combined);
    // Limpiar el input para permitir re-seleccionar el mismo archivo
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">
        Imágenes del producto (máx. {MAX_IMAGES})
      </label>

      {/* Previews */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map((file, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group">
              <img
                src={URL.createObjectURL(file)}
                alt={`preview-${i}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold"
              >
                Quitar
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] text-center py-0.5">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botón agregar */}
      {files.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors w-full justify-center"
        >
          <span className="text-lg">+</span>
          {files.length === 0 ? 'Agregar imágenes' : `Agregar más (${files.length}/${MAX_IMAGES})`}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-gray-400">JPG, PNG o WebP · Máximo 5MB por imagen · La primera imagen es la principal</p>
    </div>
  );
};

const InventoryManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [limit, setLimit] = useState<number>(20);
  const [sortBy, setSortBy] = useState<string>('reciente');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const sortProducts = (list: Product[], sort: string): Product[] => {
    const sorted = [...list];
    if (sort === 'precio_asc') return sorted.sort((a, b) => a.precio - b.precio);
    if (sort === 'precio_desc') return sorted.sort((a, b) => b.precio - a.precio);
    if (sort === 'nombre_asc') return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return sorted; // 'reciente' — orden que viene del backend
  };

  const fetchProducts = async (currentLimit = limit) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(currentLimit) };
      if (filterActive !== '') params.isActive = filterActive;
      const res = await api.get('/products/admin/list', { params });
      setProducts(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(limit); }, [filterActive, limit]);

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/products/admin/${id}/toggle`);
      fetchProducts();
    } catch (err: any) { alert(err.response?.data?.message || 'Error'); }
  };

  const onSubmit = async (data: CreateForm) => {
    setCreateError('');
    try {
      // Usar FormData para poder enviar archivos junto con los datos
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });
      imageFiles.forEach((file) => {
        formData.append('imagenes', file);
      });

      await api.post('/products/admin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowCreate(false);
      reset();
      setImageFiles([]);
      fetchProducts();
    } catch (err: any) { setCreateError(err.response?.data?.message || 'Error al crear'); }
  };

  const handleCloseModal = () => {
    setShowCreate(false);
    reset();
    setImageFiles([]);
    setCreateError('');
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(p);

  const displayedProducts = sortProducts(products, sortBy);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventario y Stock</h2>
          <p className="text-gray-400 text-sm">
            {displayedProducts.length} de {total} productos
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Filtro estado */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>

          {/* Ordenamiento */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="reciente">Más recientes</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="precio_asc">Menor precio</option>
            <option value="nombre_asc">Nombre A–Z</option>
          </select>

          {/* Cantidad por página */}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>Mostrar 10</option>
            <option value={20}>Mostrar 20</option>
            <option value={50}>Mostrar 50</option>
          </select>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#0f49bd] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + Agregar producto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Imagen', 'SKU', 'Producto', 'Marca', 'Precio contado', 'Crédito', 'Stock', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
              )) : displayedProducts.map((p) => {
                const sb = getStockBadge(p.stock, p.stockMinimo);
                const primeraImagen = p.imagenes && p.imagenes.length > 0 ? toImageUrl(p.imagenes[0]) : null;
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 ${!p.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      {primeraImagen ? (
                        <img src={primeraImagen} alt={p.nombre} className="w-10 h-10 object-contain rounded bg-gray-50" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-lg">📱</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 whitespace-nowrap">{p.nombre}</p>
                      {p.badge && <span className="text-xs bg-[#13ec6d] text-[#002f87] px-1.5 py-0.5 rounded font-medium">{p.badge}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.marca}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(p.precio)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {p.disponibleCredito && p.pagosSemanales ? `${formatPrice(p.pagosSemanales)}/sem` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 mr-2">{p.stock}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sb.cls}`}>{sb.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(p.id)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${p.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {p.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal agregar producto */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 my-4">
            <h3 className="font-bold text-lg text-gray-900 mb-5">Agregar Producto</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">SKU *</label>
                  <input {...register('sku')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="APL-14PM-256" />
                  {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Nombre del celular *</label>
                  <input {...register('nombre')} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' placeholder='iPhone 14 Pro Max 256GB' />
                  {errors.nombre && <p className='text-red-500 text-xs mt-1'>{errors.nombre.message}</p>}
                </div>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700 mb-1 block'>Marca *</label>
                <input {...register('marca')} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' placeholder='Apple / Samsung / Motorola...' />
                {errors.marca && <p className='text-red-500 text-xs mt-1'>{errors.marca.message}</p>}
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700 mb-1 block'>Descripción</label>
                <textarea {...register('descripcion')} rows={2} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Precio contado * ($)</label>
                  <input {...register('precio', { valueAsNumber: true })} type='number' step='0.01' className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' />
                  {errors.precio && <p className='text-red-500 text-xs mt-1'>{errors.precio.message}</p>}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Precio anterior ($)</label>
                  <input {...register('precioAnterior', { valueAsNumber: true })} type='number' step='0.01' className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' />
                </div>
              </div>
              <div className='grid grid-cols-3 gap-3'>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Stock *</label>
                  <input {...register('stock', { valueAsNumber: true })} type='number' min='0' className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm' />
                  {errors.stock && <p className='text-red-500 text-xs mt-1'>{errors.stock.message}</p>}
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Stock mínimo</label>
                  <input {...register('stockMinimo', { valueAsNumber: true })} type='number' min='0' defaultValue={5} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm' />
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-1 block'>Pagos/semana ($)</label>
                  <input {...register('pagosSemanales', { valueAsNumber: true })} type='number' step='0.01' className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm' />
                </div>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-700 mb-1 block'>Badge (opcional)</label>
                <input {...register('badge')} placeholder='Más Vendido / Oferta / Nuevo Ingreso' className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm' />
              </div>

              {/* Campo de imágenes */}
              <ImageUploader files={imageFiles} onChange={setImageFiles} />

              {createError && <p className='text-red-500 text-sm'>{createError}</p>}
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={handleCloseModal} className='flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50'>Cancelar</button>
                <button type='submit' disabled={isSubmitting} className='flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700'>{isSubmitting ? 'Guardando...' : 'Agregar producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InventoryManager;
