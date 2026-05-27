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
  FaLaptopCode 
} from 'react-icons/fa';
import { serviciosCorporativos } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// SERVICIOS CORPORATIVOS - Grid 3x3 con modals como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const iconMap: Record<string, JSX.Element> = {
  FaNetworkWired: <FaNetworkWired className="w-8 h-8" />,
  FaComments: <FaComments className="w-8 h-8" />,
  FaShieldAlt: <FaShieldAlt className="w-8 h-8" />,
  FaMapMarkerAlt: <FaMapMarkerAlt className="w-8 h-8" />,
  FaCloud: <FaCloud className="w-8 h-8" />,
  FaTruck: <FaTruck className="w-8 h-8" />,
  FaUsers: <FaUsers className="w-8 h-8" />,
  FaMobileAlt: <FaMobileAlt className="w-8 h-8" />,
  FaLaptopCode: <FaLaptopCode className="w-8 h-8" />,
};

const ServiciosCorp = () => {
  const [selectedServicio, setSelectedServicio] = useState<string | null>(null);

  const handleOpenModal = (id: string) => {
    setSelectedServicio(id);
  };

  const handleCloseModal = () => {
    setSelectedServicio(null);
  };

  const servicio = serviciosCorporativos.find((s) => s.id === selectedServicio);

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Título */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Servicios Corporativos Exclusivos
          </h2>
          <p className="text-xl text-gray-600">
            Potencia tu empresa con soluciones tecnológicas de vanguardia diseñadas para el crecimiento.
          </p>
        </div>

        {/* Grid 3x3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviciosCorporativos.map((servicio) => (
            <div
              key={servicio.id}
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition cursor-pointer group"
              onClick={() => handleOpenModal(servicio.id)}
            >
              {/* Icono */}
              <div className="text-primary-500 mb-4 group-hover:scale-110 transition">
                {iconMap[servicio.icono] || <FaNetworkWired className="w-8 h-8" />}
              </div>

              {/* Título */}
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition">
                {servicio.titulo}
              </h3>

              {/* Descripción corta */}
              <p className="text-gray-600 mb-4 text-sm">
                {servicio.descripcionCorta}
              </p>

              {/* CTA */}
              <button className="text-primary-600 font-semibold text-sm hover:underline">
                Descubrir más →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {servicio && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Descripción larga */}
            <p className="text-gray-700 leading-relaxed mb-6">
              {servicio.descripcionLarga}
            </p>

            {/* Beneficios */}
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

            {/* CTA */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleCloseModal}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cerrar
              </button>
              <button className="flex-1 bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition">
                Contactar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServiciosCorp;
