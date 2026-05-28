import { sucursales, contactoGeneral } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// SUCURSALES - Mapa y ubicaciones como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════
// NOTA: Para Google Maps real, reemplazar API_KEY en la URL del iframe

const Sucursales = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Nuestras Sucursales
          </h1>
          <p className="text-xl text-blue-100">
            Visítanos en Tapachula, Chiapas
          </p>
        </div>
      </section>

      {/* Google Maps */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d0!2d-92.2614!3d14.9067!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDU0JzI0LjEiTiA5MsKwMTUnNDEuMCJX!5e0!3m2!1ses!2smx!4v1"
              width="100%"
              height="500"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de sucursales ACXOCEL"
              className="w-full"
            ></iframe>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            * Si el mapa no carga correctamente,{' '}
            <a
              href="https://www.google.com/maps/search/Plaza+Las+Galerías+Tapachula+Chiapas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 underline"
            >
              abre en Google Maps
            </a>
          </p>
        </div>
      </section>

      {/* Tarjetas de sucursales */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Ubicaciones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sucursales.map((sucursal) => (
              <div
                key={sucursal.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
              >
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">📍</div>
                    <div>
                      <h3 className="text-2xl font-bold">{sucursal.nombre}</h3>
                      <p className="text-blue-100 text-sm mt-1">Tapachula, Chiapas</p>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  {/* Dirección */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-1">Dirección:</h4>
                    <p className="text-gray-600">{sucursal.direccion}</p>
                  </div>

                  {/* Teléfono */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-1">Teléfono:</h4>
                    <p className="text-gray-600">{contactoGeneral.telefono}</p>
                  </div>

                  {/* Horario */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-1">Horario:</h4>
                    <p className="text-gray-600">{sucursal.horario}</p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={sucursal.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition text-sm"
                    >
                      🗺️ Ver en Google Maps
                    </a>
                    <a
                      href={`tel:${sucursal.telefono}`}
                      className="flex-1 text-center bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition text-sm"
                    >
                      📞 Llamar
                    </a>
                    <a
                      href={`https://wa.me/${sucursal.whatsapp}?text=Hola,%20quisiera%20información%20sobre%20sus%20productos%20y%20servicios`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition text-sm"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Necesitas orientación personalizada?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Contamos con asesores listos para atenderte en nuestras sucursales
            o a través de nuestros canales digitales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`https://wa.me/${contactoGeneral.whatsapp}?text=Hola,%20quisiera%20información`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-600 transition"
            >
              💬 Contactar asesor
            </a>
            <a
              href={`tel:${contactoGeneral.telefono}`}
              className="bg-primary-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-600 transition"
            >
              📞 Llamar ahora
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sucursales;