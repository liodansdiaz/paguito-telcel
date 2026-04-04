import { useState } from 'react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '../../utils/notifications';
import api from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showError('Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
      showSuccess(data.data.message || 'Revisa tu correo electrónico');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Error al enviar el correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu correo</h1>
            <p className="text-gray-600 mb-6">
              Si el correo <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
              <p className="font-medium mb-1">📧 Importante:</p>
              <ul className="text-left list-disc list-inside space-y-1">
                <li>El enlace es válido por 1 hora</li>
                <li>Revisa tu carpeta de spam si no lo ves</li>
                <li>Solo puedes usar el enlace una vez</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full bg-primary-500 text-white text-center py-3 rounded-lg font-medium hover:bg-secondary-500 transition-colors"
            >
              Volver al inicio de sesión
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="block w-full text-gray-600 text-center py-2 hover:text-gray-900 transition-colors text-sm"
            >
              Enviar a otro correo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[primary-500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h1>
          <p className="text-gray-600">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@ejemplo.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-secondary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : (
              'Enviar enlace de recuperación'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            <strong>Nota de seguridad:</strong> Por razones de seguridad, siempre mostraremos este mensaje aunque el correo no esté registrado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
