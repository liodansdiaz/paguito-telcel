import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const VendorLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-[#0f49bd] text-white shadow-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#13ec6d] rounded-lg flex items-center justify-center font-bold text-[#002f87]">P</div>
          <div>
            <p className="font-bold text-sm">Paguito Telcel</p>
            <p className="text-blue-200 text-xs">Portal Vendedor</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{user?.nombre}</p>
            <p className="text-xs text-blue-200">{user?.zona || 'Sin zona'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default VendorLayout;
