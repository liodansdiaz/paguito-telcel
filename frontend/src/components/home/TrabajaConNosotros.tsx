import { Link } from 'react-router-dom';
import { contactoGeneral } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// TRABAJA CON NOSOTROS - Sección como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const TrabajaConNosotros = () => {
  const whatsappUrl = `https://wa.me/${contactoGeneral.whatsapp}?text=Hola,%20me%20interesa%20trabajar%20en%20ACXOCEL`;

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Grid 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Columna izquierda: Imagen */}
          <div className="relative">
            {/* Placeholder: reemplazar con imagen real de oficina/equipo */}
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl overflow-hidden">
              <img
                src="/images/trabajo-placeholder.jpg"
                alt="Trabaja con nosotros"
                className="w-full h-[400px] object-cover"
                onError={(e) => {
                  // Fallback si no existe la imagen
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="h-[400px] flex items-center justify-center text-6xl">
                      💼
                    </div>
                  `;
                }}
              />
            </div>
          </div>

          {/* Columna derecha: Texto */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trabaja con Nosotros
            </h2>
            
            <p className="text-xl text-gray-600 mb-6">
              Únete a un equipo ganador.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8">
              Buscamos talento apasionado por la tecnología y el servicio al cliente.
              En ACXOCEL encontrarás un ambiente de crecimiento, capacitación constante
              y oportunidades de desarrollo profesional.
            </p>

            {/* Datos de contacto */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-gray-700">
                <span className="text-primary-500">📍</span>
                <span><strong>Oficinas:</strong> Tapachula, Chiapas</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <span className="text-primary-500">📞</span>
                <span><strong>Teléfono:</strong> {contactoGeneral.telefono}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <span className="text-primary-500">📧</span>
                <span><strong>Email RH:</strong> {contactoGeneral.emailRH}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
              >
                <span>💬</span>
                Enviar WhatsApp a Reclutamiento
              </a>
              
              <Link
                to="/trabaja"
                className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                Ver Bolsa de Trabajo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrabajaConNosotros;
