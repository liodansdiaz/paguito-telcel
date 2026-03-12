import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Carrito from '../ui/Carrito';
import ChatWidget from '../chat/ChatWidget';

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/nosotros', label: 'Quiénes somos' },
  { to: '/faq', label: 'Preguntas frecuentes' },
  { to: '/mi-reserva', label: 'Mi reserva' },
];

const PublicLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-[#002f87] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3" onClick={closeMobile}>
              <img src="/logo.svg" alt="Amigo Paguitos Telcel" className="w-12 h-12" />
              <span className="font-bold text-xl tracking-tight">Amigo Paguitos Telcel</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`transition-colors text-sm font-medium ${
                    location.pathname === to ? 'text-[#13ec6d]' : 'hover:text-[#13ec6d]'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Carrito />
              <Link to="/login" className="bg-[#13ec6d] text-[#002f87] p-2 rounded-lg hover:bg-green-400 transition-colors" title="Portal Vendedores">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Link>
            </nav>

            {/* Mobile: carrito + hamburguesa */}
            <div className="flex md:hidden items-center gap-2">
              <Carrito />
              <button
                className="text-white p-1"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden bg-[#001f5c] border-t border-white/10">
            <nav className="flex flex-col px-4 py-3 gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMobile}
                  className={`py-3 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === to
                      ? 'bg-[#13ec6d]/20 text-[#13ec6d]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Link
                to="/login"
                onClick={closeMobile}
                className="mt-2 flex items-center gap-2 py-3 px-3 rounded-lg text-sm font-medium bg-[#13ec6d] text-[#002f87] hover:bg-green-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Portal Vendedores
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Asistente virtual flotante */}
      <ChatWidget />

      {/* Footer */}
      <footer className="bg-[#002a5c] text-white py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Amigo Paguitos Telcel" className="w-12 h-12 object-contain" />
              <div>
                <p className="font-bold text-lg">Amigo Paguitos Telcel</p>
                <p className="text-blue-300 text-sm">Tu celular a la puerta de tu casa</p>
              </div>
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
