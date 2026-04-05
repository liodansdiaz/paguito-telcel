import { Link } from 'react-router-dom';

// Mapeo de logos locales por nombre
const getLogoSrc = (nombre: string): string | null => {
  const logos: Record<string, string> = {
    'Scotiabank': '/logos/Frame.webp',
    'Santander': '/logos/Frame-1.webp',
    'OXXO': '/logos/Oxxo.png',
    'Banorte': '/logos/Frame-3.webp',
    'Liverpool': '/logos/Frame-5.webp',
    'Palacio de Hierro': '/logos/Frame-6.webp',
    'BBVA': '/logos/Frame-7.webp',
    'Telmex': '/logos/Frame-13.webp',
    'Elektra': '/logos/Frame-10.webp',
    'Claro': '/logos/Frame-12.webp',
    'Mercado Pago': '/logos/version-horizontal-large-logo-mercado-pago.webp',
  };
  return logos[nombre] || null;
};

// Lista de bancos y tiendas
const bancosYTiendas = [
  { nombre: 'Scotiabank', label: 'Scotiabank' },
  { nombre: 'Santander', label: 'Santander' },
  { nombre: 'OXXO', label: 'OXXO' },
  { nombre: 'Banorte', label: 'Banorte' },
  { nombre: 'Liverpool', label: 'Liverpool' },
  { nombre: 'Palacio de Hierro', label: 'Palacio de Hierro' },
  { nombre: 'BBVA', label: 'BBVA' },
  { nombre: 'Telmex', label: 'Telmex' },
  { nombre: 'Elektra', label: 'Elektra' },
  { nombre: 'Claro', label: 'Claro' },
  { nombre: 'Mercado Pago', label: 'Mercado Pago' },
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
          <p className="text-white text-sm mt-4 font-medium">
            Ten a la mano tu <strong>número de cuenta Amigo Paguitos</strong> al momento de realizar tu pago.
          </p>
        </div>
      </section>

      {/* ── Descripción ─────────────────────────────────────────────────────── */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            Realiza tu pago semanal, con tarjeta de débito o crédito en cualquier Centro de Atención a Clientes, en estos bancos y comercios autorizados; únicamente indica tu número de cuenta Amigo Paguitos.
          </p>
        </div>
      </section>

      {/* ── Bancos y tiendas ──────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 bg-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1">Red de cobro</p>
            <h2 className="text-2xl font-bold text-gray-900">Bancos y tiendas autorizadas</h2>
          </div>

          {/* Grid de logos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {bancosYTiendas.map((lugar) => {
              const logoSrc = getLogoSrc(lugar.nombre);
              return (
                <div key={lugar.nombre} className="bg-white rounded-xl p-4 flex items-center justify-center border border-gray-100 hover:shadow-md transition-shadow h-24">
                  {logoSrc ? (
                    <img 
                      src={logoSrc} 
                      alt={lugar.label} 
                      className="max-h-16 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-700">{lugar.label}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Etiquetas adicionales */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
              <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">CACs, DATS, CVTs Telcel</p>
              <p className="text-sm text-gray-600">y Cadenas Comerciales</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
              <img src="/logos/Frame-1.webp" alt="Telcel" className="h-8 mx-auto mb-2" />
              <p className="text-sm text-gray-600">telcel.com</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
              <img src="/logos/Frame-1.webp" alt="Cajeros" className="h-8 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Cajeros ATM</p>
            </div>
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