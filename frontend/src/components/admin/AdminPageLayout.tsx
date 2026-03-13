import Pagination from '../ui/Pagination';

interface AdminPageLayoutProps {
  title: string;
  subtitle: string;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  loading: boolean;
  exporting: boolean;

  // Event handlers
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onExport: () => void;
  onAdd?: () => void;
  addButtonText?: string;

  // Props para búsqueda avanzada
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  filters?: React.ReactNode;
  activeFilters?: React.ReactNode;

  // Contenido
  children: React.ReactNode;
}

export const AdminPageLayout = ({
  title, subtitle, total, page, totalPages, limit, loading, exporting,
  onPageChange, onLimitChange, onExport, onAdd, addButtonText,
  searchPlaceholder, searchValue, onSearchChange, onKeyDown, filters, activeFilters,
  children,
}: AdminPageLayoutProps) => {
  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-400 text-sm">{subtitle}</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={onExport}
            disabled={exporting || total === 0 || loading}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            title="Exportar a CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exportando...' : 'CSV'}
          </button>
          <select value={limit} onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={10}>Mostrar 10</option>
            <option value={15}>Mostrar 15</option>
            <option value={20}>Mostrar 20</option>
            <option value={50}>Mostrar 50</option>
          </select>
          {onAdd && (
            <button onClick={onAdd} className="bg-[#0f49bd] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap">
              {addButtonText || '+ Agregar'}
            </button>
          )}
        </div>
      </div>

      {/* Búsqueda avanzada */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 block mb-1">Buscar</label>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {filters}
        </div>
        {activeFilters && <div className="mt-3 flex flex-wrap gap-2 items-center">{activeFilters}</div>}
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {children}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={(l) => { onLimitChange(l); onPageChange(1); }}
        />
      </div>
    </div>
  );
};

export default AdminPageLayout;
