import { Link } from 'react-router-dom';

const valores = [
  {
    titulo: 'Confianza',
    desc: 'Operamos con transparencia total. Te explicamos cada condición del crédito antes de firmar, sin letras chicas ni sorpresas.',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[primary-500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    titulo: 'Accesibilidad',
    desc: 'Creemos que todos merecen un buen celular. Por eso ofrecemos crédito sin buró ni aval, con pagos semanales que se adaptan a tu bolsillo.',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[primary-500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
    ),
  },
  {
    titulo: 'Comodidad',
    desc: 'Tu tiempo vale. Llevamos el celular hasta tu puerta en el horario que tú elijas, sin que tengas que hacer filas ni desplazarte.',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[primary-500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
      </svg>
    ),
  },
  {
    titulo: 'Calidad',
    desc: 'Vendemos únicamente equipos originales, nuevos y con garantía Telcel. Tu celular llega sellado, listo para usar desde el primer día.',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[primary-500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

const Nosotros = () => {
  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[secondary-500] to-[primary-500] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <img src="https://res.cloudinary.com/dq4mwiut5/image/upload/v1775375372/LOGO_AMIGO_PAGUITOS_azul_rgb_Horizontal2-2_akxj8i.webp" alt="Amigo Paguitos Telcel" className="w-16 h-16 mx-auto mb-4" />
          <span className="bg-[accent-500] text-[secondary-500] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4 inline-block">
            Nuestra historia
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            ¿Quiénes somos?
          </h1>
          <p className="text-blue-100 text-base max-w-xl mx-auto">
            Somos un equipo comprometido con acercar la tecnología a cada familia, sin complicaciones y sin salir de casa.
          </p>
        </div>
      </section>

      {/* ── Historia ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-[primary-500] uppercase tracking-widest mb-2">Nuestra historia</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nacimos para hacer más fácil tu próxima compra</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                <strong className="text-gray-700">Amigo Paguitos Telcel</strong> nació de la necesidad de ofrecer una alternativa real a quienes quieren un celular de calidad pero no cuentan con tarjeta de crédito, historial bancario o tiempo para ir a una tienda.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Somos distribuidores autorizados de equipos Telcel y operamos con un modelo simple: tú eliges tu celular en línea, nosotros vamos hasta tu puerta. El crédito se tramita en la visita, sin buró, sin aval y con pagos semanales accesibles.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Hoy contamos con un equipo de vendedores capacitados que atienden diferentes zonas, listos para llevarte el equipo que necesitas en el horario que más te convenga.
              </p>
            </div>

            {/* Tarjeta de datos clave */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-2xl p-6 text-center">
                <p className="text-3xl font-extrabold text-[secondary-500] mb-1">100%</p>
                <p className="text-gray-500 text-sm">Equipos originales y nuevos</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-6 text-center">
                <p className="text-3xl font-extrabold text-[accent-500] mb-1">0</p>
                <p className="text-gray-500 text-sm">Consultas al buró de crédito</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-6 text-center">
                <p className="text-3xl font-extrabold text-[secondary-500] mb-1">7</p>
                <p className="text-gray-500 text-sm">Días a la semana disponibles</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-6 text-center">
                <p className="text-3xl font-extrabold text-[accent-500] mb-1">1 día</p>
                <p className="text-gray-500 text-sm">Para tener tu celular en casa</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Misión y Visión ───────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[secondary-500] rounded-2xl p-8 text-white">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[accent-500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-3">Nuestra misión</h3>
            <p className="text-blue-200 text-sm leading-relaxed">
              Hacer accesible la tecnología móvil a todas las familias, ofreciendo equipos originales con crédito flexible, atención personalizada y servicio a domicilio sin complicaciones.
            </p>
          </div>
          <div className="bg-gradient-to-br from-[primary-500] to-[secondary-500] rounded-2xl p-8 text-white">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[accent-500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-3">Nuestra visión</h3>
            <p className="text-blue-200 text-sm leading-relaxed">
              Ser la opción número uno de venta de celulares a crédito y a domicilio en la región, reconocidos por nuestra honestidad, rapidez y el trato cercano con cada cliente.
            </p>
          </div>
        </div>
      </section>

      {/* ── Valores ───────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[primary-500] uppercase tracking-widest mb-1">Lo que nos define</p>
            <h2 className="text-2xl font-bold text-gray-900">Nuestros valores</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {valores.map((v) => (
              <div key={v.titulo} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow flex gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {v.svg}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{v.titulo}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[secondary-500] to-[primary-500] text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">¿Listo para conocernos mejor?</h2>
          <p className="text-blue-200 mb-8">
            Explora nuestro catálogo y agenda tu visita. Sin compromiso, sin costo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalogo"
              className="bg-[accent-500] text-[secondary-500] px-8 py-3 rounded-xl font-bold text-sm hover:bg-green-400 transition-all shadow-lg"
            >
              Ver catálogo
            </Link>
            <Link
              to="/faq"
              className="bg-white/10 border border-white/30 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-all"
            >
              Preguntas frecuentes
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Nosotros;
