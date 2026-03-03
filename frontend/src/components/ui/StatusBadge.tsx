import type { EstadoReserva, EstadoCliente } from '../../types';

const reservaColors: Record<EstadoReserva, string> = {
  NUEVA: 'bg-blue-100 text-blue-700',
  ASIGNADA: 'bg-indigo-100 text-indigo-700',
  EN_VISITA: 'bg-yellow-100 text-yellow-700',
  VENDIDA: 'bg-green-100 text-green-700',
  NO_CONCRETADA: 'bg-orange-100 text-orange-700',
  CANCELADA: 'bg-red-100 text-red-700',
  SIN_STOCK: 'bg-gray-100 text-gray-600',
};

const reservaLabels: Record<EstadoReserva, string> = {
  NUEVA: 'Nueva',
  ASIGNADA: 'Asignada',
  EN_VISITA: 'En visita',
  VENDIDA: 'Vendida',
  NO_CONCRETADA: 'No concretada',
  CANCELADA: 'Cancelada',
  SIN_STOCK: 'Sin stock',
};

const clienteColors: Record<EstadoCliente, string> = {
  ACTIVO: 'bg-green-100 text-green-700',
  BLOQUEADO: 'bg-red-100 text-red-700',
};

interface Props {
  type: 'reserva' | 'cliente';
  estado: string;
}

const StatusBadge = ({ type, estado }: Props) => {
  if (type === 'reserva') {
    const color = reservaColors[estado as EstadoReserva] || 'bg-gray-100 text-gray-600';
    const label = reservaLabels[estado as EstadoReserva] || estado;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  }

  const color = clienteColors[estado as EstadoCliente] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {estado === 'ACTIVO' ? 'Activo' : 'Bloqueado'}
    </span>
  );
};

export default StatusBadge;
