import { useState } from 'react';
import { contactoGeneral } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// TE LLAMAMOS - Botón flotante + modal formulario como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const TeLlamamos = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    celular: '',
    tipoInfo: 'Ventas',
    contacto: 'WhatsApp',
    mensaje: '',
    aceptaPrivacidad: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrar con backend
    console.log('Formulario Te llamamos:', formData);
    setSubmitted(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSubmitted(false);
    setFormData({
      nombre: '',
      apellido: '',
      celular: '',
      tipoInfo: 'Ventas',
      contacto: 'WhatsApp',
      mensaje: '',
      aceptaPrivacidad: false,
    });
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-500 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-primary-600 transition-all transform hover:scale-105 z-50 flex items-center gap-2"
      >
        <span>📞</span>
        <span className="font-semibold">Te llamamos</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-lg max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Te llamamos</h3>
                <p className="text-gray-600 mt-1">
                  Déjanos tus datos y un asesor se pondrá en contacto contigo.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                ×
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Solicitud enviada!
                </h4>
                <p className="text-gray-600 mb-6">
                  Un asesor se comunicará contigo pronto.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nombre(s)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Apellido(s)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellido}
                      onChange={(e) =>
                        setFormData({ ...formData, apellido: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Celular */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Número de Celular (10 dígitos)
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={formData.celular}
                    onChange={(e) =>
                      setFormData({ ...formData, celular: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="9994106182"
                  />
                </div>

                {/* Tipo de información */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tipo de información que desea solicitar
                  </label>
                  <select
                    value={formData.tipoInfo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipoInfo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Ventas">Ventas</option>
                    <option value="Amigo Paguitos">Amigo Paguitos</option>
                    <option value="Planes">Planes Telcel</option>
                    <option value="Corporativo">Trato corporativo</option>
                    <option value="Bolsa trabajo">Bolsa trabajo</option>
                    <option value="Atención a clientes">Atención a clientes</option>
                  </select>
                </div>

                {/* Método de contacto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    ¿Cómo deseas que te contactemos?
                  </label>
                  <select
                    value={formData.contacto}
                    onChange={(e) =>
                      setFormData({ ...formData, contacto: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Llamada telefónica">Llamada telefónica</option>
                  </select>
                </div>

                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mensaje
                  </label>
                  <textarea
                    value={formData.mensaje}
                    onChange={(e) => {
                      if (e.target.value.length <= 355) {
                        setFormData({ ...formData, mensaje: e.target.value });
                      }
                    }}
                    maxLength={355}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  ></textarea>
                  <p className="text-xs text-gray-500 text-right">
                    {formData.mensaje.length}/355
                  </p>
                </div>

                {/* Aceptar privacidad */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.aceptaPrivacidad}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aceptaPrivacidad: e.target.checked,
                      })
                    }
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-600">
                    Acepto la{' '}
                    <button
                      type="button"
                      className="text-primary-600 underline"
                    >
                      Política de privacidad
                    </button>
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-600 transition"
                >
                  Solicitar contacto
                </button>
              </form>
            )}

            {/* Horario */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">
                Horario atención comercial
              </p>
              <p className="text-sm font-semibold text-gray-700">
                De lunes a Viernes de 9:00 a 18:00 hrs.
              </p>
              <p className="text-sm font-semibold text-gray-700">
                Sábados de 9:00 a 15:00 hrs.
              </p>
            </div>

            {/* WhatsApp directo */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 mb-2">O contáctanos directo:</p>
              <a
                href={`https://wa.me/${contactoGeneral.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 transition"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeLlamamos;