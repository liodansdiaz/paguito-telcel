import { Outlet, Link, useNavigate } from 'react-router-dom';
import Carrito from '../ui/Carrito';

const PublicLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-[#002f87] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#13ec6d] rounded-lg flex items-center justify-center font-bold text-[#002f87] text-lg">P</div>
              <span className="font-bold text-xl tracking-tight">Paguito Telcel</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="hover:text-[#13ec6d] transition-colors text-sm font-medium">Inicio</Link>
              <Link to="/catalogo" className="hover:text-[#13ec6d] transition-colors text-sm font-medium">Catálogo</Link>
              <Link to="/nosotros" className="hover:text-[#13ec6d] transition-colors text-sm font-medium">Quiénes somos</Link>
              <Link to="/faq" className="hover:text-[#13ec6d] transition-colors text-sm font-medium">Preguntas frecuentes</Link>
              <Link to="/mi-reserva" className="hover:text-[#13ec6d] transition-colors text-sm font-medium">Mi reserva</Link>
              <Carrito />
              <Link to="/login" className="bg-[#13ec6d] text-[#002f87] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-400 transition-colors">Portal Vendedores</Link>
            </nav>
            {/* Mobile menu */}
            <button
              className="md:hidden text-white"
              onClick={() => navigate('/catalogo')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#002a5c] text-white py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <p className="font-bold text-lg">Amigos Paguito Telcel</p>
              <p className="text-blue-300 text-sm">Tu celular a la puerta de tu casa</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Navegación</p>
              <Link to="/" className="text-blue-300 text-sm hover:text-white transition-colors">Inicio</Link>
              <Link to="/catalogo" className="text-blue-300 text-sm hover:text-white transition-colors">Catálogo</Link>
              <Link to="/nosotros" className="text-blue-300 text-sm hover:text-white transition-colors">Quiénes somos</Link>
              <Link to="/faq" className="text-blue-300 text-sm hover:text-white transition-colors">Preguntas frecuentes</Link>
              <Link to="/mi-reserva" className="text-blue-300 text-sm hover:text-white transition-colors">Mi reserva</Link>
            </div>
            <p className="text-blue-300 text-sm md:self-end">© {new Date().getFullYear()} Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
