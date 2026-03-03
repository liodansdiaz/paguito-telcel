import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
  { label: 'Reservas', path: '/admin/reservas', icon: '📋' },
  { label: 'Clientes', path: '/admin/clientes', icon: '👥' },
  { label: 'Vendedores', path: '/admin/vendedores', icon: '🧑‍💼' },
  { label: 'Inventario', path: '/admin/inventario', icon: '📦' },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#002f87] text-white flex flex-col shrink-0 shadow-xl">
        {/* Logo */}
        <div className="p-5 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#13ec6d] rounded-lg flex items-center justify-center font-bold text-[#002f87] text-lg">P</div>
            <div>
              <p className="font-bold text-sm leading-tight">Paguito Telcel</p>
              <p className="text-blue-300 text-xs">Panel Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-[#13ec6d] text-[#002f87]' : 'text-blue-100 hover:bg-blue-800'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[#13ec6d] rounded-full flex items-center justify-center text-[#002f87] font-bold text-sm">
              {user?.nombre?.charAt(0) ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.nombre}</p>
              <p className="text-xs text-blue-300 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-blue-300 hover:text-white flex items-center gap-2 py-1"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="text-gray-800 font-semibold text-lg">
            {navItems.find((n) => location.pathname.startsWith(n.path))?.label ?? 'Admin'}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
            Conectado como {user?.rol}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
