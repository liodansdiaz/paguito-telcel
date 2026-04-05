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
      <header className="bg-[primary-500] text-white shadow-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="https://res.cloudinary.com/dq4mwiut5/image/upload/v1775375372/LOGO_AMIGO_PAGUITOS_azul_rgb_Horizontal2-2_akxj8i.webp" alt="Amigo Paguitos Telcel" className="h-8" />
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
