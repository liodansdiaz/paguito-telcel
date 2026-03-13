import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';
import type { Product } from '../../types';
import { showSuccess, showError } from '../../utils/notifications';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  marca: z.string().min(1, 'Marca requerida'),
  descripcion: z.string().optional(),
  precio: z.number().positive('Precio debe ser positivo'),
  precioAnterior: z.preprocess(
    (val) => (val === '' || val === null || (typeof val === 'number' && isNaN(val)) ? undefined : val),
    z.number().positive().optional()
  ),
  stock: z.number().int().min(0),
  stockMinimo: z.number().int().min(0).optional(),
  badge: z.string().optional(),
  disponibleCredito: z.boolean().optional(),
  pagosSemanales: z.number().positive().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

const MAX_IMAGES = 3;

const getStockBadge = (stock: number, min: number) => {
  if (stock === 0) return { label: 'Sin stock', cls: 'bg-red-100 text-red-700' };
  if (stock <= min) return { label: 'Crítico', cls: 'bg-orange-100 text-orange-700' };
  if (stock <= min * 3) return { label: 'Bajo', cls: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Normal', cls: 'bg-green-100 text-green-700' };
};



// ── Iconos SVG inline (sin dependencia externa) ───────────────────────────────
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconToggle = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {active
      ? <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="16" cy="12" r="3" fill="currentColor" /></>
      : <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="8" cy="12" r="3" fill="currentColor" /></>
    }
  </svg>
);

// ── Selector de imágenes con preview ─────────────────────────────────────────
const ImageUploader = ({ files, existingUrls, onChange, onRemoveExisting }: {
  files: File[];
  existingUrls: string[];
  onChange: (files: File[]) => void;
  onRemoveExisting: (index: number) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const totalCount = existingUrls.length + files.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const combined = [...files, ...selected].slice(0, MAX_IMAGES - existingUrls.length);
    onChange(combined);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeNew = (index: number) => onChange(files.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">
        Imágenes del producto (máx. {MAX_IMAGES})
      </label>
      <div className="flex gap-2 flex-wrap">
        {/* Imágenes existentes */}
        {existingUrls.map((url, i) => (
          <div key={`existing-${i}`} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group">
            <img src={toImageUrl(url)} alt={`img-${i}`} className="w-full h-full object-cover" />
            <button type="button" onClick={() => onRemoveExisting(i)}
              className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold">
              Quitar
            </button>
            {i === 0 && existingUrls.length + files.length > 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] text-center py-0.5">Principal</span>
            )}
          </div>
        ))}
        {/* Archivos nuevos */}
        {files.map((file, i) => (
          <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg border border-dashed border-blue-300 overflow-hidden group">
            <img src={URL.createObjectURL(file)} alt={`new-${i}`} className="w-full h-full object-cover" />
            <button type="button" onClick={() => removeNew(i)}
              className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold">
              Quitar
            </button>
            {existingUrls.length === 0 && i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] text-center py-0.5">Principal</span>
            )}
          </div>
        ))}
      </div>
      {totalCount < MAX_IMAGES && (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors w-full justify-center">
          <span className="text-lg">+</span>
          {totalCount === 0 ? 'Agregar imágenes' : `Agregar más (${totalCount}/${MAX_IMAGES})`}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileChange} />
      <p className="text-xs text-gray-400">JPG, PNG o WebP · Máx. 5MB por imagen · La primera es la principal</p>
    </div>
  );
};

// ── Modal de confirmación de eliminación ──────────────────────────────────────
const ConfirmDeleteModal = ({ nombre, onConfirm, onCancel, loading }: {
  nombre: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <IconTrash />
      </div>
      <h3 className="font-bold text-gray-900 mb-2">¿Eliminar producto?</h3>
      <p className="text-sm text-gray-500 mb-6">
        Se eliminará <strong>{nombre}</strong> permanentemente. Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
          {loading ? 'Eliminando...' : 'Sí, eliminar'}
        </button>
      </div>
    </div>
  </div>
);

// ── Selector de memorias ──────────────────────────────────────────────────────
const MEMORIAS_SUGERIDAS = ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];

const MemoriasSelector = ({ selected, onChange }: {
  selected: string[]; onChange: (mems: string[]) => void;
}) => {
  const [custom, setCustom] = useState('');
  const toggle = (m: string) =>
    onChange(selected.includes(m) ? selected.filter(x => x !== m) : [...selected, m]);
  const addCustom = () => {
    const v = custom.trim();
    if (v && !selected.includes(v)) { onChange([...selected, v]); setCustom(''); }
  };
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">Memorias disponibles</label>
      <div className="flex flex-wrap gap-1.5">
        {MEMORIAS_SUGERIDAS.map((m) => (
          <button key={m} type="button" onClick={() => toggle(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selected.includes(m) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-blue-400'}`}>
            {m}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.filter(m => !MEMORIAS_SUGERIDAS.includes(m)).map((m) => (
            <span key={m} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              {m}
              <button type="button" onClick={() => toggle(m)} className="ml-0.5 text-blue-400 hover:text-blue-700 font-bold">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={custom} onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Otra memoria (ej: 2 TB)..."
          className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
        <button type="button" onClick={addCustom}
          className="bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded text-xs font-medium transition-colors">
          Agregar
        </button>
      </div>
    </div>
  );
};

// ── Editor de especificaciones clave-valor ────────────────────────────────────
type SpecRow = { key: string; value: string };

const EspecificacionesEditor = ({ value, onChange }: {
  value: Record<string, string>; onChange: (v: Record<string, string>) => void;
}) => {
  const [rows, setRows] = useState<SpecRow[]>(() =>
    Object.entries(value).map(([key, val]) => ({ key, value: String(val) }))
  );

  const sync = (updated: SpecRow[]) => {
    setRows(updated);
    const obj: Record<string, string> = {};
    for (const r of updated) {
      if (r.key.trim()) obj[r.key.trim()] = r.value;
    }
    onChange(obj);
  };

  const update = (i: number, field: 'key' | 'value', v: string) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, [field]: v } : r);
    sync(next);
  };

  const add = () => sync([...rows, { key: '', value: '' }]);
  const remove = (i: number) => sync(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Especificaciones técnicas</label>
        <button type="button" onClick={add}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
          + Agregar fila
        </button>
      </div>
      {rows.length === 0 && (
        <p className="text-xs text-gray-400 italic">Sin especificaciones. Haz clic en "+ Agregar fila".</p>
      )}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={row.key} onChange={(e) => update(i, 'key', e.target.value)}
              placeholder="Clave (ej: Pantalla)"
              className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <input value={row.value} onChange={(e) => update(i, 'value', e.target.value)}
              placeholder="Valor (ej: 6.7 pulgadas AMOLED)"
              className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <button type="button" onClick={() => remove(i)}
              className="text-gray-300 hover:text-red-500 transition-colors font-bold text-sm leading-none">×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Selector de colores ───────────────────────────────────────────────────────
const COLORES_SUGERIDOS = [
  'Negro', 'Blanco', 'Plata', 'Gris', 'Azul', 'Azul oscuro', 'Azul claro',
  'Verde', 'Verde menta', 'Morado', 'Rojo', 'Rosa', 'Dorado', 'Amarillo',
  'Naranja', 'Titanio', 'Titanio negro', 'Titanio natural', 'Beige', 'Café',
];

const COLOR_MAP_ADMIN: Record<string, string> = {
  negro: '#1a1a1a', blanco: '#f5f5f5', plata: '#C0C0C0', gris: '#808080',
  azul: '#2563eb', 'azul oscuro': '#1e3a8a', 'azul claro': '#60a5fa',
  verde: '#16a34a', 'verde menta': '#6ee7b7', morado: '#7c3aed',
  rojo: '#dc2626', rosa: '#ec4899', dorado: '#d97706', amarillo: '#eab308',
  naranja: '#ea580c', titanio: '#a0a098', 'titanio negro': '#3a3a3a',
  'titanio natural': '#a0a098', beige: '#d4b896', café: '#92400e', cafe: '#92400e',
};

const getColorHexAdmin = (c: string) => COLOR_MAP_ADMIN[c.toLowerCase()] ?? '#9ca3af';

const ColoresSelector = ({ selected, onChange }: {
  selected: string[]; onChange: (cols: string[]) => void;
}) => {
  const [custom, setCustom] = useState('');
  const toggle = (c: string) =>
    onChange(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c]);
  const addCustom = () => {
    const v = custom.trim();
    if (v && !selected.includes(v)) { onChange([...selected, v]); setCustom(''); }
  };
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">Colores disponibles</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
        {COLORES_SUGERIDOS.map((c) => (
          <button key={c} type="button" onClick={() => toggle(c)}
            title={c}
            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${selected.includes(c) ? 'border-blue-600 ring-2 ring-blue-200 scale-110' : 'border-gray-300'}`}
            style={{ backgroundColor: getColorHexAdmin(c) }}
          />
        ))}
      </div>
      {/* Colores seleccionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: getColorHexAdmin(c) }} />
              {c}
              <button type="button" onClick={() => toggle(c)} className="ml-0.5 text-blue-400 hover:text-blue-700 font-bold">×</button>
            </span>
          ))}
        </div>
      )}
      {/* Color personalizado */}
      <div className="flex gap-2">
        <input value={custom} onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Otro color..."
          className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
        <button type="button" onClick={addCustom}
          className="bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded text-xs font-medium transition-colors">
          Agregar
        </button>
      </div>
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────
const InventoryManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState('');
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('reciente');
  const [page, setPage] = useState(1);

  // Modal crear/editar
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState('');
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

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchProducts = async (p = page, l = limit, s = sortBy, a = filterActive) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: String(l), page: String(p), sort: s };
      if (a !== '') params.isActive = a;
      const res = await api.get('/products/admin/list', { params });
      setProducts(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); fetchProducts(1, limit, sortBy, filterActive); }, [filterActive, limit, sortBy]);

  // ── Abrir formulario de edición ──────────────────────────────────────────
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
    setFormError('');
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
    setFormError('');
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
    setFormError('');
  };

  // ── Submit crear/editar ──────────────────────────────────────────────────
  const onSubmit = async (data: ProductForm) => {
    setFormError('');
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        const isEmpty = value === undefined || value === null || (typeof value === 'number' && isNaN(value));
        if (key === 'precioAnterior' && isEditing) {
          // Enviar vacío explícitamente para que el backend borre el valor
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
        // Pasar URLs existentes que el admin no quitó
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
      fetchProducts(page, limit, sortBy, filterActive);
    } catch (err: any) { setFormError(err.response?.data?.message || 'Error al guardar'); }
  };

  // ── Toggle activo ────────────────────────────────────────────────────────
  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/products/admin/${id}/toggle`);
      showSuccess('Producto actualizado correctamente');
      fetchProducts(page, limit, sortBy, filterActive);
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al cambiar estado del producto');
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/products/admin/${deleteTarget.id}`);
      showSuccess('Producto eliminado correctamente');
      setDeleteTarget(null);
      fetchProducts(page, limit, sortBy, filterActive);
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al eliminar producto');
    }
    finally { setDeleting(false); }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(p);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Cabecera y controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventario y Stock</h2>
          <p className="text-gray-400 text-sm">{total} productos · página {page} de {totalPages || 1}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="reciente">Más recientes</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="precio_asc">Menor precio</option>
            <option value="nombre_asc">Nombre A–Z</option>
          </select>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={10}>Mostrar 10</option>
            <option value={20}>Mostrar 20</option>
            <option value={50}>Mostrar 50</option>
          </select>
          <button onClick={openCreate}
            className="bg-[#0f49bd] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap">
            + Agregar producto
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Imagen', 'SKU', 'Producto', 'Marca', 'Precio', 'Crédito', 'Stock', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                : products.map((p) => {
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
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {p.disponibleCredito && p.pagosSemanales ? `${formatPrice(p.pagosSemanales)}/sem` : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold text-gray-900 mr-2">{p.stock}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sb.cls}`}>{sb.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        {/* Acciones: iconos con tooltip */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(p)} title="Editar producto"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                              <IconEdit />
                            </button>
                            <button onClick={() => handleToggle(p.id)} title={p.isActive ? 'Desactivar' : 'Activar'}
                              className={`p-1.5 rounded-lg transition-colors ${p.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                              <IconToggle active={p.isActive} />
                            </button>
                            <button onClick={() => setDeleteTarget(p)} title="Eliminar producto"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total} productos
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => { const p = page - 1; setPage(p); fetchProducts(p); }} disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | '...')[]>((acc, n, i, arr) => {
                if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(n); return acc;
              }, [])
              .map((item, i) => item === '...'
                ? <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
                : <button key={item} onClick={() => { setPage(item as number); fetchProducts(item as number); }}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${page === item ? 'bg-[#0f49bd] text-white border-[#0f49bd]' : 'border-gray-300 hover:bg-gray-50'}`}>
                    {item}
                  </button>
              )}
            <button onClick={() => { const p = page + 1; setPage(p); fetchProducts(p); }} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente →
            </button>
          </div>
        </div>
      )}

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
              <ImageUploader
                files={imageFiles}
                existingUrls={existingImageUrls}
                onChange={setImageFiles}
                onRemoveExisting={(i) => setExistingImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
              />
              <ColoresSelector selected={selectedColores} onChange={setSelectedColores} />
              <MemoriasSelector selected={selectedMemorias} onChange={setSelectedMemorias} />
              <EspecificacionesEditor value={especificaciones} onChange={setEspecificaciones} />
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
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
        <ConfirmDeleteModal
          nombre={deleteTarget.nombre}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default InventoryManager;
