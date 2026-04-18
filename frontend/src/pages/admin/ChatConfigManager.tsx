import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ChatSection {
  id: number;
  section: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ChatConfigManager() {
  const [sections, setSections] = useState<ChatSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<ChatSection | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Cargar secciones al montar el componente
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/chat-config');
      setSections(data.data.sections || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar secciones');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: ChatSection) => {
    setEditingSection(section);
  };

  const handleSave = async () => {
    if (!editingSection) return;

    try {
      await api.put(`/admin/chat-config/${editingSection.section}`, {
        title: editingSection.title,
        content: editingSection.content,
        order: editingSection.order,
        isActive: editingSection.isActive,
      });

      toast.success('Sección actualizada correctamente');
      setEditingSection(null);
      fetchSections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar sección');
    }
  };

  const handleToggle = async (section: string, currentState: boolean) => {
    try {
      await api.patch(`/admin/chat-config/${section}/toggle`, {
        isActive: !currentState,
      });

      toast.success(`Sección ${!currentState ? 'activada' : 'desactivada'} correctamente`);
      fetchSections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const handlePreview = async () => {
    try {
      const { data } = await api.get('/admin/chat-config/preview/system-prompt');
      setSystemPrompt(data.data.systemPrompt || '');
      setShowPreview(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar preview');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración del chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración del Asistente Virtual</h1>
              <p className="text-gray-600 mt-1">
                Edita las secciones del chat sin necesidad de tocar código. Los cambios se aplican inmediatamente.
              </p>
            </div>
            <button
              onClick={handlePreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Vista Previa
            </button>
          </div>
        </div>

        {/* Lista de secciones */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                section.isActive ? 'border-green-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      {section.order}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-500">ID: {section.section}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(section.section, section.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        section.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {section.isActive ? 'Activa' : 'Inactiva'}
                    </button>
                    <button
                      onClick={() => handleEdit(section)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Editar
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{section.content}</pre>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Última actualización: {new Date(section.updatedAt).toLocaleString('es-MX')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Edición */}
      {editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Editar Sección: {editingSection.title}</h2>
              <button
                onClick={() => setEditingSection(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título de la Sección
                </label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido
                  <span className="text-gray-500 font-normal ml-2">(Soporta saltos de línea y viñetas)</span>
                </label>
                <textarea
                  value={editingSection.content}
                  onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Escribe el contenido de la sección aquí..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingSection.order}
                    onChange={(e) => setEditingSection({ ...editingSection, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={editingSection.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditingSection({ ...editingSection, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingSection(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Vista Previa del SYSTEM_PROMPT</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{systemPrompt}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
