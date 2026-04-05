import { Link } from 'react-router-dom';

// Logo BBVA
const LogoBBVA = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 5h80v30H10z" fill="#004731"/>
    <path d="M15 10h70v20H15z" fill="#fff"/>
    <path d="M18 14l8 12h-5l-4-6h-2l-4 6h-5z" fill="#fff"/>
    <path d="M30 14l8 12h-5l-4-6h-2l-4 6h-5z" fill="#fff"/>
    <path d="M42 14l8 12h-5l-4-6h-2l-4 6h-5z" fill="#fff"/>
    <path d="M55 14l8 12h-5l-4-6h-2l-4 6h-5z" fill="#fff"/>
    <path d="M67 14l8 12h-5l-4-6h-2l-4 6h-5z" fill="#fff"/>
  </svg>
);

// Logo OXXO
const LogoOXXO = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="15" fill="#E30613"/>
    <path d="M12 15c2-2 5-2 7 0 2 2 2 5 0 7-2 2-5 2-7 0-2-2-2-5 0-7z" fill="#fff"/>
    <path d="M20 10l5 10h-10l5-10z" fill="#fff"/>
    <path d="M50 12h30v5H50z" fill="#E30613"/>
    <path d="M50 18h30v5H50z" fill="#E30613"/>
    <path d="M50 24h30v5H50z" fill="#E30613"/>
    <path d="M50 30h30v5H50z" fill="#E30613"/>
  </svg>
);

// Logo Telcel
const LogoTelcel = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" fill="#fff"/>
    <circle cx="20" cy="20" r="12" fill="#DA291C"/>
    <path d="M14 20a6 6 0 1112 0" fill="#fff"/>
    <path d="M20 14v12" stroke="#fff" strokeWidth="2"/>
    <path d="M14 20h12" stroke="#fff" strokeWidth="2"/>
    <path d="M45 12h40v16H45z" fill="#DA291C"/>
    <path d="M50 18h30v4H50z" fill="#fff"/>
  </svg>
);

// Logo Walmart
const LogoWalmart = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" fill="#fff"/>
    <path d="M10 10h15v20H10z" fill="#0071CE"/>
    <path d="M30 10h15v20H30z" fill="#0071CE"/>
    <path d="M50 10h15v20H50z" fill="#0071CE"/>
    <path d="M70 10h15v20H70z" fill="#0071CE"/>
  </svg>
);

// Logo Chedraui
const LogoChedraui = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" fill="#fff"/>
    <circle cx="25" cy="20" r="12" fill="#E40046"/>
    <path d="M20 20l5-5v10z" fill="#fff"/>
    <path d="M45 10h30v5H45z" fill="#E40046"/>
    <path d="M45 18h30v5H45z" fill="#E40046"/>
    <path d="M45 26h30v5H45z" fill="#E40046"/>
  </svg>
);

// Logo Soriana
const LogoSoriana = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" fill="#fff"/>
    <path d="M10 10h20v20H10z" fill="#F58220"/>
    <path d="M35 10h20v20H35z" fill="#F58220"/>
    <path d="M60 10h20v20H60z" fill="#F58220"/>
  </svg>
);

// Logo Banorte
const LogoBanorte = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" fill="#fff"/>
    <path d="M10 15h30v10H10z" fill="#E61842"/>
    <path d="M45 15h30v10H45z" fill="#000"/>
    <path d="M80 15h10v10H80z" fill="#E61842"/>
  </svg>
);

// Logo Santander
const LogoSantander = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" fill="#fff"/>
    <circle cx="50" cy="20" r="15" fill="#EC0000"/>
    <path d="M40 15h20v10H40z" fill="#fff"/>
  </svg>
);

// Logo Citibanamex
const LogoCitibanamex = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" fill="#fff"/>
    <circle cx="25" cy="20" r="12" fill="#003B5C"/>
    <path d="M18 15l7 5-7 5z" fill="#fff"/>
    <path d="M45 10h30v20H45z" fill="#003B5C"/>
    <path d="M50 15h20v5H50z" fill="#fff"/>
  </svg>
);

// Logo Extra
const LogoExtra = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" fill="#fff"/>
    <circle cx="20" cy="20" r="10" fill="#E30613"/>
    <path d="M15 20h10" stroke="#fff" strokeWidth="2"/>
    <path d="M45 10h30v5H45z" fill="#E30613"/>
    <path d="M45 18h30v5H45z" fill="#E30613"/>
    <path d="M45 26h30v5H45z" fill="#E30613"/>
  </svg>
);

// Logo Mercado Pago
const LogoMercadoPago = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" fill="#fff"/>
    <circle cx="30" cy="20" r="12" fill="#009EE3"/>
    <path d="M22 20h16" stroke="#fff" strokeWidth="2"/>
    <path d="M50 10h30v20H50z" fill="#009EE3"/>
    <path d="M55 15h20v3H55z" fill="#fff"/>
    <path d="M55 21h20v3H55z" fill="#fff"/>
  </svg>
);

// Logo Cajero ATM
const LogoATM = ({ className = "h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="40" rx="5" fill="#2D3748"/>
    <rect x="10" y="8" width="80" height="24" rx="3" fill="#4A5568"/>
    <rect x="20" y="15" width="15" height="10" rx="1" fill="#48BB78"/>
    <rect x="40" y="15" width="15" height="10" rx="1" fill="#48BB78"/>
    <rect x="60" y="15" width="15" height="10" rx="1" fill="#48BB78"/>
  </svg>
);

// Mapeo de logos por nombre
const getLogoComponent = (nombre: string) => {
  const logos: Record<string, React.FC<{ className?: string }>> = {
    'BBVA': LogoBBVA,
    'OXXO': LogoOXXO,
    'Telcel': LogoTelcel,
    'Walmart': LogoWalmart,
    'Chedraui': LogoChedraui,
    'Soriana': LogoSoriana,
    'Banorte': LogoBanorte,
    'Santander': LogoSantander,
    'Citibanamex': LogoCitibanamex,
    'Extra': LogoExtra,
    'Mercado Pago': LogoMercadoPago,
    'Cajeros ATM': LogoATM,
  };
  return logos[nombre] || null;
};

const mediosPago = [
  {
    titulo: 'Pago en línea',
    desc: 'Realiza tu pago semanal con tarjeta de débito o crédito desde la comodidad de tu hogar.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    titulo: 'Centros de Atención Telcel',
    desc: 'Visita cualquier Centro de Atención a Clientes (CAC), DATS o CVT Telcel para realizar tu pago.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    titulo: 'Tiendas de conveniencia',
    desc: 'Paga en tiendas like OXXO, Extra, Chedraui y otras cadenas comerciales autorizadas.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-4 8v-4m4-4h4m-8 0H4m4 0h4m-1-4v4m4-4h4m-8 8v-4m4-4h4" />
      </svg>
    ),
  },
  {
    titulo: 'Cajeros ATM',
    desc: 'Utiliza los cajeros automáticos de bancos participantes para pagar tu factura.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
];

const bancosYTiendas = [
  { nombre: 'BBVA' },
  { nombre: 'Santander' },
  { nombre: 'Banorte' },
  { nombre: 'Citibanamex' },
  { nombre: 'OXXO' },
  { nombre: 'Extra' },
  { nombre: 'Chedraui' },
  { nombre: 'Soriana' },
  { nombre: 'Walmart' },
  { nombre: 'Mercado Pago' },
  { nombre: 'Telcel' },
  { nombre: 'Cajeros ATM' },
];

const DondePagar = () => {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-secondary-500 to-primary-500 text-white py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="bg-accent-500 text-secondary-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4 inline-block">
            Medios de pago
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3">
            ¿Dónde pagar?
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto">
            Para facilitar el pago de tu factura, Telcel pone a tu disposición diferentes formas de pago.
          </p>
        </div>
      </section>

      {/* ── Importante ───────────────────────────────────────────────────────── */}
      <section className="py-8 px-4 bg-yellow-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-yellow-800 text-sm mb-1">IMPORTANTE</p>
              <p className="text-yellow-700 text-sm">
                Ten a la mano tu <strong>número de cuenta Amigo Paguitos</strong> al momento de realizar tu pago.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Medios de pago ────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {mediosPago.map((medio) => (
              <div key={medio.titulo} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  {medio.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{medio.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{medio.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bancos y tiendas ──────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1">Red de cobro</p>
            <h2 className="text-2xl font-bold text-gray-900">Bancos y tiendas autorizadas</h2>
            <p className="text-gray-500 text-sm mt-2">
              Puedes pagar en cualquiera de estos establecimientos
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {bancosYTiendas.map((lugar) => {
              const LogoComponent = getLogoComponent(lugar.nombre);
              return (
                <div key={lugar.nombre} className="bg-white rounded-xl p-4 flex items-center justify-center border border-gray-100 hover:shadow-md transition-shadow h-20">
                  {LogoComponent ? (
                    <LogoComponent className="h-10 max-w-full" />
                  ) : (
                    <span className="text-sm font-medium text-gray-700">{lugar.nombre}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-sm">
                La recepción del pago en efectivo, con tarjeta de débito o crédito depende de cada establecimiento. En los distintos Telcel se cobrará una comisión por el pago.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-secondary-500 to-primary-500 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">¿Tienes dudas sobre tu pago?</h2>
          <p className="text-blue-200 mb-6">
            Contáctanos y con gusto te orientamos sobre tus opciones de pago.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/faq"
              className="bg-white/10 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-all"
            >
              Ver preguntas frecuentes
            </Link>
            <Link
              to="/catalogo"
              className="bg-[accent-500] text-secondary-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-400 transition-all shadow-lg"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DondePagar;