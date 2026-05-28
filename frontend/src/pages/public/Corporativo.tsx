import { useState } from 'react';
import {
  FaNetworkWired,
  FaComments,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaCloud,
  FaTruck,
  FaUsers,
  FaMobileAlt,
  FaLaptopCode,
} from 'react-icons/fa';
import { serviciosCorporativos, contactoGeneral } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// CORPORATIVO - Servicios B2B como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const iconMap: Record<string, JSX.Element> = {
  FaNetworkWired: <FaNetworkWired className="w-12 h-12" />,
  FaComments: <FaComments className="w-12 h-12" />,
  FaShieldAlt: <FaShieldAlt className="w-12 h-12" />,
  FaMapMarkerAlt: <FaMapMarkerAlt className="w-12 h-12" />,
  FaCloud: <FaCloud className="w-12 h-12" />,
  FaTruck: <FaTruck className="w-12 h-12" />,
  FaUsers: <FaUsers className="w-12 h-12" />,
  FaMobileAlt: <FaMobileAlt className="w-12 h-12" />,
  FaLaptopCode: <FaLaptopCode className="w-12 h-12" />,
};

const Corporativo = () => {
  const [selectedServicio, setSelectedServicio] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    empresa: '',
    contacto: '',
    telefono: '',
    email: '',
    servicio: '',
    mensaje: '',
  });

  const servicio = serviciosCorporativos.find((s) => s.id === selectedServicio);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrar con backend
    alert('Formulario enviado (TODO: integrar con backend)');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Soluciones Corporativas
          </h1>
          <p className="text-xl text-blue-100 mb-6">
            Potencia tu empresa con la Red 5G de Telcel y servicios de vanguardia.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={`https://wa.me/${contactoGeneral.whatsapp}?text=Hola,%20necesito%20información%20sobre%20servicios%20corporativos`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-600 transition"
            >
              💬 Contactar por WhatsApp
            </a>
            <a
              href="#formulario"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Solicitar cotización
            </a>
          </div>
        </div>
      </section>

      {/* Grid de servicios */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Nuestros Servicios Corporativos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviciosCorporativos.map((srv) => (
              <div
                key={srv.id}
                className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition cursor-pointer group"
                onClick={() => setSelectedServicio(srv.id)}
              >
                {/* Icono */}
                <div className="text-primary-500 mb-6 group-hover:scale-110 transition">
                  {iconMap[srv.icono]}
                </div>

                {/* Título */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition">
                  {srv.titulo}
                </h3>

                {/* Descripción corta */}
                <p className="text-gray-600 mb-4">
                  {srv.descripcionCorta}
                </p>

                {/* Beneficios (primeros 2) */}
                <ul className="space-y-2 mb-4 text-sm text-gray-700">
                  {srv.beneficios.slice(0, 2).map((beneficio, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{beneficio}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button className="text-primary-600 font-semibold hover:underline">
                  Descubrir más →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario de contacto */}
      <section id="formulario" className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Necesitas una solución empresarial?
            </h2>
            <p className="text-xl text-gray-600">
              Completa el formulario y un asesor se pondrá en contacto contigo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-8 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nombre de empresa */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: ACME Corp"
                />
              </div>

              {/* Contacto */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Contacto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Juan Pérez"
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
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="999 410 6182"
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="contacto@empresa.com"
                />
              </div>

              {/* Servicio de interés */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Servicio de Interés
                </label>
                <select
                  value={formData.servicio}
                  onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Seleccione un servicio</option>
                  {serviciosCorporativos.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.titulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mensaje */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Cuéntanos sobre tus necesidades..."
                ></textarea>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-primary-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-600 transition"
              >
                Enviar Solicitud
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-500 text-center">
              También puedes contactarnos por WhatsApp:{' '}
              <a
                href={`https://wa.me/${contactoGeneral.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 font-semibold underline"
              >
                {contactoGeneral.telefono}
              </a>
            </p>
          </form>
        </div>
      </section>

      {/* Modal de servicio */}
      {servicio && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedServicio(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="text-primary-500">
                  {iconMap[servicio.icono]}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {servicio.titulo}
                </h3>
              </div>
              <button
                onClick={() => setSelectedServicio(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              {servicio.descripcionLarga}
            </p>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Beneficios:</h4>
              <ul className="space-y-2">
                {servicio.beneficios.map((beneficio, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-primary-500 mt-1">•</span>
                    <span className="text-gray-700">{beneficio}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setSelectedServicio(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cerrar
              </button>
              <a
                href="#formulario"
                onClick={() => setSelectedServicio(null)}
                className="flex-1 text-center bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                Solicitar cotización
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Corporativo;
