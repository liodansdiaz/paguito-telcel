import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Carrito from '../ui/Carrito';
import ChatWidget from '../chat/ChatWidget';
import TeLlamamos from '../ui/TeLlamamos';
import { contactoGeneral } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// NAVEGACIÓN CORPORATIVA ACXOCEL (basada en Cencel.com.mx)
// ════════════════════════════════════════════════════════════════════════════

const NAV_LINKS = [
  { to: '/', label: 'Inicio', isActive: (path: string) => path === '/' },
  { to: '/nosotros', label: 'Nosotros', isActive: (path: string) => path === '/nosotros' },
  { 
    label: 'Servicios', 
    isActive: (path: string) => path.startsWith('/planes') || path.startsWith('/amigo-paguitos') || path.startsWith('/equipos') || path.startsWith('/corporativo'),
    dropdown: [
      { to: '/planes-comparativa', label: 'Planes Telcel Libre', desc: 'Encuentra el plan perfecto para ti.' },
      { to: '/planes', label: 'Calculadora de Beneficios', desc: 'Calcula cuánto puedes ahorrar.' },
      { to: '/amigo-paguitos', label: '⭐ Amigo Paguitos', desc: 'Financia tu equipo con pagos semanales.', destacado: true },
      { to: '/equipos', label: 'Equipos', desc: 'Smartphones de las mejores marcas.' },
      { to: '/corporativo', label: 'Servicios Corporativos', desc: 'Soluciones empresariales Telcel.' },
    ],
  },
  { to: '/equipos', label: 'Equipos', isActive: (path: string) => path === '/equipos' },
  { to: '/corporativo', label: 'Atención Corporativa', isActive: (path: string) => path === '/corporativo' },
  { to: '/sucursales', label: 'Sucursales', isActive: (path: string) => path === '/sucursales' },
  { to: '/trabaja', label: 'Trabaja con Nosotros', isActive: (path: string) => path === '/trabaja' },
];

// Logo pequeño de Telcel
const TelcelLogo = () => (
  <img src="/telcel-azul.png" alt="Telcel" className="h-8" onError={(e) => {
    e.currentTarget.style.display = 'none';
  }} />
);

// Icono login
const IconLogin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

// Icono hamburguesa
const IconMenu = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// Icono cierre
const IconClose = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PublicLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [serviciosOpen, setServiciosOpen] = useState(false);
  const location = useLocation();

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ═══════════════════════════════════════════════════════════════════════
         NAVBAR CORPORATIVO ACXOCEL
         ═══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-white text-gray-700 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo ACXOCEL */}
            <Link to="/" className="flex items-center gap-3" onClick={closeMobile}>
              <div className="text-2xl font-extrabold text-primary-600 tracking-tight">
                ACXOCEL
              </div>
              <span className="hidden sm:block text-[10px] text-gray-500 uppercase tracking-wider border-l border-gray-300 pl-3">
                Distribuidor Autorizado Telcel Región 8
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                // Si tiene dropdown
                if (link.dropdown) {
                  return (
                    <div
                      key={link.label}
                      className="relative group"
                      onMouseEnter={() => setServiciosOpen(true)}
                      onMouseLeave={() => setServiciosOpen(false)}
                    >
                      <button
                        className={`px-3 py-2 text-[13px] font-semibold uppercase tracking-wide transition-colors rounded-lg ${
                          link.isActive?.(location.pathname)
                            ? 'text-primary-600 bg-primary-50'
                            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                        }`}
                      >
                        {link.label} ▾
                      </button>

                      {/* Dropdown servicios (como Cencel) */}
                      <div
                        className={`absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 ${
                          serviciosOpen ? 'block' : 'hidden'
                        }`}
                      >
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={closeMobile}
                            className={`block px-4 py-3 hover:bg-gray-50 transition ${
                              item.destacado ? 'bg-amber-50 border-l-4 border-amber-400' : ''
                            }`}
                          >
                            <div className={`text-sm ${item.destacado ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                              {item.label}
                            </div>
                            {item.desc && (
                              <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Link normal
                return (
                  <Link
                    key={link.label}
                    to={link.to!}
                    className={`px-3 py-2 text-[13px] font-semibold uppercase tracking-wide transition-colors rounded-lg ${
                      link.isActive?.(location.pathname)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Carrito (solo visible en rutas de Amigo Paguitos) */}
              {location.pathname.startsWith('/amigo-paguitos') && <Carrito />}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <TelcelLogo />
              <Link
                to="/login"
                className="hidden lg:flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors text-sm font-semibold"
                title="Portal"
              >
                <IconLogin />
                <span className="text-[13px]">Portal</span>
              </Link>

              {/* Mobile: hamburguesa */}
              <button
                className="lg:hidden text-gray-600 p-1"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {mobileOpen ? <IconClose /> : <IconMenu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <nav className="flex flex-col px-4 py-3 gap-1">
              {NAV_LINKS.map((link) => {
                if (link.dropdown) {
                  return (
                    <div key={link.label}>
                      <div className="py-3 px-3 text-sm font-bold text-gray-500 uppercase tracking-wide">
                        {link.label}
                      </div>
                      <div className="ml-4 border-l-2 border-gray-200 pl-2">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={closeMobile}
                            className={`block py-2.5 px-3 rounded-lg text-sm ${
                              item.destacado
                                ? 'font-bold text-amber-700 bg-amber-50'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.label}
                    to={link.to!}
                    onClick={closeMobile}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium ${
                      link.isActive?.(location.pathname)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Carrito mobile */}
              {location.pathname.startsWith('/amigo-paguitos') && (
                <div className="py-2 px-3">
                  <Carrito />
                </div>
              )}

              <Link
                to="/login"
                onClick={closeMobile}
                className="mt-2 flex items-center gap-2 py-3 px-3 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
              >
                <IconLogin />
                Portal Vendedores / Admin
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
         MAIN CONTENT
         ═══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
         ASISTENTE VIRTUAL + BOTÓN TE LLAMAMOS
         ═══════════════════════════════════════════════════════════════════════ */}
      <ChatWidget />
      <TeLlamamos />

      {/* ═══════════════════════════════════════════════════════════════════════
         FOOTER CORPORATIVO ACXOCEL (como Cencel.com.mx)
         ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Grid 4 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Logo + Info legal */}
            <div>
              <div className="text-2xl font-extrabold text-white mb-2">
                ACXOCEL
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                ACXOCEL S.A. de C.V.<br />
                Distribuidor Autorizado Telcel Región 8<br />
                Tapachula, Chiapas, México
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Derechos Reservados {new Date().getFullYear()}
              </p>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h6 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Enlaces Rápidos
              </h6>
              <div className="flex flex-col gap-2">
                <Link to="/nosotros" className="text-gray-300 text-sm hover:text-white transition-colors">Nosotros</Link>
                <Link to="/planes-comparativa" className="text-gray-300 text-sm hover:text-white transition-colors">Planes Telcel</Link>
                <Link to="/equipos" className="text-gray-300 text-sm hover:text-white transition-colors">Equipos</Link>
                <Link to="/corporativo" className="text-gray-300 text-sm hover:text-white transition-colors">Servicios Corporativos</Link>
                <Link to="/sucursales" className="text-gray-300 text-sm hover:text-white transition-colors">Sucursales</Link>
                <Link to="/trabaja" className="text-gray-300 text-sm hover:text-white transition-colors">Bolsa de trabajo</Link>
                <Link to="/amigo-paguitos" className="text-gray-300 text-sm hover:text-white transition-colors font-semibold">⭐ Amigo Paguitos</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h6 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Legal
              </h6>
              <div className="flex flex-col gap-2">
                <button className="text-gray-300 text-sm hover:text-white transition-colors text-left">
                  Aviso de Privacidad
                </button>
                <button className="text-gray-300 text-sm hover:text-white transition-colors text-left">
                  Aviso de No Discriminación
                </button>
                <Link to="/amigo-paguitos/faq" className="text-gray-300 text-sm hover:text-white transition-colors">
                  Preguntas Frecuentes
                </Link>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h6 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Contacto
              </h6>
              <div className="flex flex-col gap-2 text-gray-300 text-sm">
                <span>📞 {contactoGeneral.telefono}</span>
                <span>📧 {contactoGeneral.email}</span>
                <span>📍 Tapachula, Chiapas</span>
                <a
                  href={`https://wa.me/${contactoGeneral.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 font-semibold"
                >
                  💬 WhatsApp
                </a>
              </div>

              {/* Redes sociales placeholder */}
              <div className="flex gap-4 mt-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-xl">
                  FB
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-xl">
                  IG
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-xl">
                  X
                </a>
              </div>
            </div>
          </div>

          {/* Separador */}
          <hr className="border-gray-700" />

          {/* Copyright */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} ACXOCEL. Todos los derechos reservados.
            </p>
            <p className="mt-1">
              Distribuidor Autorizado Telcel - Región 8 
              (Quintana Roo, Chiapas, Yucatán, Campeche)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
