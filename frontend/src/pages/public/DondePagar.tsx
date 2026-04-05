import { Link } from 'react-router-dom';

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
  { nombre: 'BBVA', logo: '🏦' },
  { nombre: 'Santander', logo: '🏦' },
  { nombre: 'Banorte', logo: '🏦' },
  { nombre: 'Citibanamex', logo: '🏦' },
  { nombre: 'OXXO', logo: '🏪' },
  { nombre: 'Extra', logo: '🏪' },
  { nombre: 'Chedraui', logo: '🏪' },
  { nombre: 'Soriana', logo: '🏪' },
  { nombre: 'Walmart', logo: '🏪' },
  { nombre: 'Mercado Pago', logo: '📱' },
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {bancosYTiendas.map((lugar) => (
              <div key={lugar.nombre} className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-3xl mb-2 block">{lugar.logo}</span>
                <p className="text-sm font-medium text-gray-700">{lugar.nombre}</p>
              </div>
            ))}
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