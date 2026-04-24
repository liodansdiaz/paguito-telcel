import { useState, useEffect } from 'react';
import api from '../../services/api';
import { showSuccess, showError } from '../../utils/notifications';

type EstrategiaAsignacion = 'ROUND_ROBIN' | 'MANUAL';

interface ConfigData {
  estrategia: EstrategiaAsignacion;
  actualizadoEn: string;
  actualizadoPor: {
    id: string;
    nombre: string;
  } | null;
}

interface Strategy {
  value: EstrategiaAsignacion;
  label: string;
  description: string;
}

const AssignmentConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<EstrategiaAsignacion>('ROUND_ROBIN');
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configRes, strategiesRes] = await Promise.all([
        api.get('/admin/assignment-config'),
        api.get('/admin/assignment-config/strategies'),
      ]);
      
      const configData = configRes.data.data;
      setConfig(configData);
      setSelectedStrategy(configData.estrategia);
      setStrategies(strategiesRes.data.data);
    } catch (error: any) {
      console.error('Error al cargar configuración:', error);
      showError(error.response?.data?.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/assignment-config', {
        estrategia: selectedStrategy,
      });
      
      setConfig(res.data.data);
      showSuccess('Configuración actualizada correctamente');
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);
      showError(error.response?.data?.message || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = config && selectedStrategy !== config.estrategia;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Asignación</h1>
        <p className="text-gray-600 mt-2">
          Configura cómo se asignan las reservas a los vendedores
        </p>
      </div>

      {/* Configuración Actual */}
      {config && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">Configuración Actual</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  <strong>Estrategia activa:</strong>{' '}
                  {strategies.find((s) => s.value === config.estrategia)?.label || config.estrategia}
                </p>
                {config.actualizadoPor && (
                  <p className="mt-1">
                    <strong>Última modificación:</strong>{' '}
                    {new Date(config.actualizadoEn).toLocaleString('es-MX')} por {config.actualizadoPor.nombre}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selección de Estrategia */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Estrategia de Asignación de Vendedores
        </h2>

        <div className="space-y-4">
          {strategies.map((strategy) => (
            <label
              key={strategy.value}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedStrategy === strategy.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="estrategia"
                value={strategy.value}
                checked={selectedStrategy === strategy.value}
                onChange={() => setSelectedStrategy(strategy.value)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="ml-3 flex-1">
                <div className="font-semibold text-gray-900">{strategy.label}</div>
                <div className="text-sm text-gray-600 mt-1">{strategy.description}</div>
                
                {/* Indicadores visuales */}
                {strategy.value === 'ROUND_ROBIN' && (
                  <div className="mt-2 flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded inline-flex">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Automático
                  </div>
                )}
                {strategy.value === 'MANUAL' && (
                  <div className="mt-2 flex items-center text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded inline-flex">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Requiere acción manual
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Advertencia si hay cambios */}
        {hasChanges && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Cambios pendientes</h3>
                <p className="mt-1 text-sm text-amber-700">
                  {selectedStrategy === 'MANUAL'
                    ? 'Al activar la asignación manual, las nuevas reservas NO se asignarán automáticamente. Recibirás notificaciones por email y WhatsApp para asignar manualmente.'
                    : 'Al activar Round Robin, las nuevas reservas se asignarán automáticamente al vendedor que hace más tiempo que no recibe una reserva.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botón Guardar */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              hasChanges && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </span>
            ) : (
              'Guardar Configuración'
            )}
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">ℹ️ Información Importante</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Los cambios aplican <strong>solo para nuevas reservas</strong></li>
          <li>Las reservas ya creadas mantienen su asignación actual</li>
          <li>En modo Manual, debes asignar vendedores desde el panel de reservas</li>
          <li>Recibirás notificaciones por email y WhatsApp cuando haya reservas sin asignar</li>
        </ul>
      </div>
    </div>
  );
};

export default AssignmentConfig;
