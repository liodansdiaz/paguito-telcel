import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { systemConfigApi, adminUsersApi, type AdminUser } from '../../services/system-config.api';

// Tipos locales
interface FormNotificaciones {
  whatsappCliente: boolean;
  whatsappVendedor: boolean;
}

interface FormResumen {
  habilitado: boolean;
  frecuencia: 'diario' | 'cada_2_dias' | 'semanal';
  hora: string;
  diaSemana: number;
  adminIds: string[];
}

const diasSemana = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

// Componente: Toggle Switch
const ToggleSwitch = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-between py-4 px-5 bg-white rounded-xl border border-gray-100 shadow-sm">
    <div className="flex-1 pr-4">
      <p className="font-semibold text-gray-800">{label}</p>
      {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:scale-105'
      } ${
        checked
          ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30'
          : 'bg-gray-200 shadow-inner'
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          checked ? 'translate-x-8' : 'translate-x-1'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
    </button>
  </div>
);

// Componente: Select
const SelectField = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(typeof options[0].value === 'number' ? Number(e.target.value) : e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// Componente: Time Input
const TimeInput = ({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

const Configuracion = () => {
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificaciones, setNotificaciones] = useState<FormNotificaciones>({
    whatsappCliente: true,
    whatsappVendedor: true,
  });
  const [resumen, setResumen] = useState<FormResumen>({
    habilitado: true,
    frecuencia: 'diario',
    hora: '09:00',
    diaSemana: 1,
    adminIds: [],
  });
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Cargar datos iniciales desde la base de datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Cargando configuración desde DB...');
        
        const [notifRes, resumenRes, adminsRes] = await Promise.all([
          systemConfigApi.getNotificaciones(),
          systemConfigApi.getResumen(),
          adminUsersApi.getAll(),
        ]);

        // El backend envuelve la respuesta en sendSuccess: { success, message, data }
        // así que el contenido real está en .data.data
        const notifData = notifRes.data.data;
        const resumenData = resumenRes.data.data;
        const adminsData = adminsRes.data.data;

        console.log('📥 Notificaciones data:', notifData);
        console.log('📥 Resumen data:', resumenData);

        // Cargar configuración de WhatsApp desde DB
        setNotificaciones({
          whatsappCliente: notifData.whatsappCliente,
          whatsappVendedor: notifData.whatsappVendedor,
        });

        // Cargar configuración del resumen desde DB
        setResumen({
          habilitado: resumenData.habilitado,
          frecuencia: resumenData.frecuencia,
          hora: resumenData.hora,
          diaSemana: resumenData.diaSemana,
          adminIds: resumenData.adminIds,
        });

        // Cargar admins
        setAdmins(adminsData.filter((a: AdminUser) => a.isActive));
      } catch (error) {
        console.error('Error cargando configuración:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Solo actualiza el estado local (no guarda inmediatamente)
  const handleNotificacionesChange = (field: keyof FormNotificaciones, value: boolean) => {
    setNotificaciones((prev) => ({ ...prev, [field]: value }));
  };

  // Solo actualiza el estado local
  const handleResumenChange = (field: keyof FormResumen, value: unknown) => {
    setResumen((prev) => ({ ...prev, [field]: value }));
  };

  // Guardar TODA la configuración con un solo botón
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      console.log('💾 Guardando configuración...');
      console.log('  WhatsApp Cliente:', notificaciones.whatsappCliente);
      console.log('  WhatsApp Vendedor:', notificaciones.whatsappVendedor);
       
      // Guardar notificaciones WhatsApp
      const notifResult = await systemConfigApi.updateNotificaciones({
        whatsappCliente: notificaciones.whatsappCliente,
        whatsappVendedor: notificaciones.whatsappVendedor,
      });
      
      console.log('✅ Notificaciones guardadas:', notifResult.data.data);

      // Guardar configuración del resumen
      const resumenResult = await systemConfigApi.updateResumen(resumen);
      console.log('✅ Resumen guardado:', resumenResult.data.data);

      toast.success('Configuración guardada correctamente');
    } catch (error: any) {
      console.error('❌ Error guardando configuración:', error);
      console.error('Response:', error.response?.data);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold">Configuración del Sistema</h2>
        <p className="text-slate-300 mt-2">
          Controla el comportamiento de las notificaciones y resúmenes automáticos
        </p>
      </div>

      {/* Sección: Notificaciones WhatsApp */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.06 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Notificaciones WhatsApp</h3>
            <p className="text-sm text-gray-500">Activa o desactiva los mensajes automáticos</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-2 space-y-1">
          <ToggleSwitch
            label="WhatsApp al Cliente"
            description="Enviar mensaje de confirmación cuando se crea una reserva"
            checked={notificaciones.whatsappCliente}
            onChange={(value) => handleNotificacionesChange('whatsappCliente', value)}
            disabled={saving}
          />
          <ToggleSwitch
            label="WhatsApp al Vendedor"
            description="Notificar cuando se le asigna una nueva reserva"
            checked={notificaciones.whatsappVendedor}
            onChange={(value) => handleNotificacionesChange('whatsappVendedor', value)}
            disabled={saving}
          />
        </div>
      </section>

      {/* Sección: Resumen Diario por Email */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Resumen Diario por Email</h3>
            <p className="text-sm text-gray-500">Configura cómo y cuándo recibir el informe</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
          {/* Habilitar/Deshabilitar */}
          <ToggleSwitch
            label="Resumen Habilitado"
            description="Recibir correos automáticos con el resumen del día"
            checked={resumen.habilitado}
            onChange={(value) => handleResumenChange('habilitado', value)}
            disabled={saving}
          />

          {resumen.habilitado && (
            <>
              {/* Frecuencia */}
              <SelectField
                label="Frecuencia de Envío"
                value={resumen.frecuencia}
                onChange={(value) => handleResumenChange('frecuencia', value as 'diario' | 'cada_2_dias' | 'semanal')}
                options={[
                  { value: 'diario', label: 'Diario' },
                  { value: 'cada_2_dias', label: 'Cada 2 días' },
                  { value: 'semanal', label: 'Semanal' },
                ]}
                disabled={saving}
              />

              {/* Hora */}
              <TimeInput
                label="Hora de Envío"
                value={resumen.hora}
                onChange={(value) => handleResumenChange('hora', value)}
                disabled={saving}
              />

              {/* Día de la semana (solo si es semanal) */}
              {resumen.frecuencia === 'semanal' && (
                <SelectField
                  label="Día de la Semana"
                  value={resumen.diaSemana}
                  onChange={(value) => handleResumenChange('diaSemana', value as number)}
                  options={diasSemana}
                  disabled={saving}
                />
              )}

              {/* Selección de Administradores */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Administradores que reciben el resumen
                </label>
                <div className="relative">
                  <select
                    multiple
                    value={resumen.adminIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      handleResumenChange('adminIds', selected);
                    }}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-32"
                  >
                    {admins.length === 0 ? (
                      <option disabled>No hay administradores activos disponibles</option>
                    ) : (
                      admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.nombre} - {admin.email}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-400 mt-2">
                    Mantén presionada la tecla Ctrl (Windows) o Cmd (Mac) para seleccionar múltiples
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Botón Guardar - única fuente de verdad */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
};

export default Configuracion;
