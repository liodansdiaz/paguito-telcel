import { useState } from 'react';
import { contactoGeneral } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// TRABAJA CON NOSOTROS - Bolsa de trabajo como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const Trabaja = () => {
  const [showForm, setShowForm] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const whatsappUrl = `https://wa.me/${contactoGeneral.whatsapp}?text=Hola,%20me%20interesa%20trabajar%20en%20ACXOCEL`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Trabaja con Nosotros
          </h1>
          <p className="text-xl text-blue-100">
            Únete a un equipo ganador en ACXOCEL
          </p>
        </div>
      </section>

      {/* Imagen + texto */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Imagen */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl overflow-hidden">
                {/* Placeholder de imagen */}
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">💼</div>
                    <p className="text-gray-500 font-semibold">Únete a nuestro equipo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Texto */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    ¿Por qué trabajar en ACXOCEL?
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 rounded-full p-3">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Crecimiento Profesional</h3>
                    <p className="text-gray-600">Oportunidades reales de desarrollo y capacitación constante en telecomunicaciones.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 rounded-full p-3">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Excelente Ambiente Laboral</h3>
                    <p className="text-gray-600">Trabajamos en equipo, con respeto y comunicación abierta en todas las áreas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 rounded-full p-3">
                    <span className="text-2xl">⭐</span>
                 </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Marca de Prestigio</h3>
                    <p className="text-gray-600">Sé parte del distribuidor autorizado Telcel más importante de la Región 8.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 rounded-full p-3">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Prestaciones de Ley</h3>
                    <p className="text-gray-600">Seguridad social, vacaciones, aguinaldo y todas las prestaciones que marca la ley.</p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-primary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-600 transition"
                >
                  {showForm ? 'Ocultar formulario' : 'Enviar mi CV'}
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  💬 Contactar por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de CV */}
      {showForm && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Envía tu CV
              </h2>

              <form className="space-y-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Juan Pérez López"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="juan@ejemplo.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="999 410 6182"
                  />
                </div>

                {/* Puesto de interés */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Puesto de Interés
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option value="">Selecciona una opción</option>
                    <option value="ventas">Ventas / Atención al cliente</option>
                    <option value="almacen">Almacén / Logística</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="marketing">Marketing / Redes Sociales</option>
                    <option value="sistemas">Sistemas / TI</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {/* Adjuntar CV */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adjuntar CV (PDF, Word, JPG) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition">
                    {cvFile ? (
                      <div className="space-y-2">
                        <p className="text-green-600 font-semibold">✓ {cvFile.name}</p>
                        <button
                          type="button"
                          onClick={() => setCvFile(null)}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Quitar archivo
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500 mb-2">
                          Arrastra tu CV aquí o haz clic para seleccionar
                        </p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="cv-upload"
                        />
                        <label
                          htmlFor="cv-upload"
                          className="inline-block bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition cursor-pointer"
                        >
                          Seleccionar archivo
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 5 MB. Formatos: PDF, Word, JPG, PNG
                  </p>
                </div>

                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mensaje / Notas
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Cuéntanos por qué te gustaría trabajar con nosotros..."
                  ></textarea>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-primary-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-600 transition"
                >
                  Enviar CV
                </button>

                <p className="text-sm text-gray-500 text-center">
                  También puedes enviarnos tu CV por WhatsApp a{' '}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 font-semibold underline"
                  >
                    {contactoGeneral.telefono}
                  </a>
                </p>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Datos de contacto */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            ¿Tienes dudas?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="font-bold text-gray-900 mb-2">Teléfono</h3>
              <p className="text-gray-600">{contactoGeneral.telefono}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="font-bold text-gray-900 mb-2">Email RH</h3>
              <p className="text-gray-600">{contactoGeneral.emailRH}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="font-bold text-gray-900 mb-2">Ubicación</h3>
              <p className="text-gray-600">Tapachula, Chiapas</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Trabaja;