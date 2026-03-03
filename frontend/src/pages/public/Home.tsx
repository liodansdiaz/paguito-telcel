import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    { icon: '📦', title: 'Catálogo completo', desc: 'iPhone, Samsung, Xiaomi, Motorola y más marcas top.' },
    { icon: '📅', title: 'Reserva en minutos', desc: 'Agenda tu visita con fecha y horario preferido.' },
    { icon: '🚀', title: 'Entrega a domicilio', desc: 'Un vendedor va a tu casa o lugar de trabajo.' },
    { icon: '💳', title: 'Contado o crédito', desc: 'Elige la opción de pago que más te convenga.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#002f87] to-[#0f49bd] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="bg-[#13ec6d] text-[#002f87] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-6 inline-block">
            Servicio a domicilio
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Tu próximo celular,<br />
            <span className="text-[#13ec6d]">en la puerta de tu casa</span>
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Elige tu celular favorito, agenda una visita y un vendedor te lo lleva. Sin filas, sin esperas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalogo"
              className="bg-[#13ec6d] text-[#002f87] px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-400 transition-all shadow-lg"
            >
              Ver catálogo
            </Link>
            <Link
              to="/login"
              className="bg-white/10 border border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
            >
              Portal vendedores
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            ¿Por qué elegir Paguito Telcel?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="text-center p-6 rounded-xl bg-gray-50 hover:shadow-md transition-shadow">
                <span className="text-4xl mb-4 block">{f.icon}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#002f87] text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para estrenar celular?</h2>
          <p className="text-blue-200 mb-8">Explora nuestro catálogo y reserva ahora mismo.</p>
          <Link
            to="/catalogo"
            className="bg-[#13ec6d] text-[#002f87] px-10 py-4 rounded-xl font-bold text-lg hover:bg-green-400 transition-all inline-block"
          >
            Explorar celulares
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
