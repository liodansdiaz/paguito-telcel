// Planes Telcel - Datos hardcodeados basados en Cencel.com.mx

export interface Plan {
  id: string;
  nombre: string;
  tipo: 'Masivo' | 'Profamily';
  renta: 'Abierto' | 'Controlado';
  gigasBase: number;
  gigasPromo: number;
  gigasTotales: number;
  beneficios: string[];
  precioLibre: number;
  precioControlado: number;
  apps: string[]; // Apps sin límite
}

export const planes: Plan[] = [
  {
    id: 'TL1',
    nombre: 'Telcel Libre 1',
    tipo: 'Masivo',
    renta: 'Abierto',
    gigasBase: 2,
    gigasPromo: 1,
    gigasTotales: 3,
    beneficios: ['Redes Sociales ilimitadas', 'WhatsApp', 'Facebook'],
    precioLibre: 299,
    precioControlado: 249,
    apps: ['WhatsApp', 'Facebook', 'X', 'Instagram'],
  },
  {
    id: 'TL2',
    nombre: 'Telcel Libre 2',
    tipo: 'Masivo',
    renta: 'Abierto',
    gigasBase: 4,
    gigasPromo: 2,
    gigasTotales: 6,
    beneficios: ['Redes Sociales ilimitadas', 'WhatsApp', 'Facebook', 'Uber'],
    precioLibre: 399,
    precioControlado: 349,
    apps: ['WhatsApp', 'Facebook', 'X', 'Instagram', 'Snapchat', 'Uber'],
  },
  {
    id: 'TL3',
    nombre: 'Telcel Libre 3',
    tipo: 'Masivo',
    renta: 'Abierto',
    gigasBase: 6,
    gigasPromo: 3,
    gigasTotales: 9,
    beneficios: ['Redes Sociales ilimitadas', 'Apps sin costo', 'Llamadas ilimitadas'],
    precioLibre: 499,
    precioControlado: 449,
    apps: ['WhatsApp', 'Facebook', 'X', 'Instagram', 'Snapchat', 'Uber'],
  },
  {
    id: 'TL4',
    nombre: 'Telcel Libre 4',
    tipo: 'Masivo',
    renta: 'Abierto',
    gigasBase: 10,
    gigasPromo: 5,
    gigasTotales: 15,
    beneficios: ['Redes Sociales ilimitadas', 'Apps sin costo', 'Llamadas y SMS ilimitados'],
    precioLibre: 599,
    precioControlado: 549,
    apps: ['WhatsApp', 'Facebook', 'X', 'Instagram', 'Snapchat', 'Uber'],
  },
  {
    id: 'TL5',
    nombre: 'Telcel Libre 5',
    tipo: 'Masivo',
    renta: 'Abierto',
    gigasBase: 15,
    gigasPromo: 15,
    gigasTotales: 30,
    beneficios: ['Doble de Gigas', 'Redes Sociales ilimitadas', 'Apps sin costo', 'Llamadas ilimitadas'],
    precioLibre: 699,
    precioControlado: 649,
    apps: ['WhatsApp', 'Facebook', 'X', 'Instagram', 'Snapchat', 'Uber'],
  },
  {
    id: 'TL6',
    nombre: 'Telcel Libre 6',
    tipo: 'Masivo',
    renta: 'Abierto',
    gigasBase: 20,
    gigasPromo: 20,
    gigasTotales: 40,
    beneficios: ['Doble de Gigas', 'Redes Sociales ilimitadas', 'Apps sin costo', 'Roaming USA/CAN'],
    precioLibre: 799,
    precioControlado: 749,
    apps: ['WhatsApp', 'Facebook', 'X', 'Instagram', 'Snapchat', 'Uber'],
  },
  {
    id: 'TL7',
    nombre: 'Telcel Libre 7',
    tipo: 'Masivo',
    renta: 'Abierto',
    gigasBase: 30,
    gigasPromo: 30,
    gigasTotales: 60,
    beneficios: ['Doble de Gigas', 'Redes Sociales ilimitadas', 'Apps sin costo', 'Roaming USA/CAN'],
    precioLibre: 999,
    precioControlado: 949,
    apps: ['WhatsApp', 'Facebook', 'X', 'Instagram', 'Snapchat', 'Uber'],
  },
  {
    id: 'TL8',
    nombre: 'Telcel Libre 8',
    tipo: 'Masivo',
    renta: 'Abierto',
    gigasBase: 50,
    gigasPromo: 50,
    gigasTotales: 100,
    beneficios: ['Doble de Gigas', 'Redes Sociales ilimitadas', 'Apps sin costo', 'Roaming USA/CAN'],
    precioLibre: 1299,
    precioControlado: 1249,
    apps: ['WhatsApp', 'Facebook', 'X', 'Instagram', 'Snapchat', 'Uber'],
  },
];

// Apps incluidas sin costo (info para modal)
export const appsIncluidas = {
  whatsapp: {
    nombre: 'WhatsApp',
    incluye: [
      'Envío y recepción de Mensajes (texto)',
      'Funcionalidad "Estados"',
      'Notas de voz',
      'Imágenes, fotos y Video',
      'Contactos de agenda',
      'Notificaciones',
      'Llamadas y Videollamadas',
      'Uso en México, E.U.A. y Canadá',
    ],
  },
  facebook: {
    nombre: 'Facebook',
    incluye: [
      'Visualización del muro',
      'Publicar o comentar "Mi Estado"',
      'Guardar fotos y Dar "Me Gusta"',
      'Comentar o compartir historias',
      'Publicar/cargar fotos y videos (apps oficiales)',
      'Enviar texto/imágenes por Facebook Messenger',
      'Recibir notificaciones',
    ],
  },
  x: {
    nombre: 'X (Twitter)',
    incluye: [
      'Publicar y Comentar',
      'Dar "Me gusta" (Favorito)',
      'Citar y Repostear',
      'Visualizar Timeline',
      'Cargar y descargar fotos',
    ],
  },
  instagram: {
    nombre: 'Instagram',
    incluye: [
      'Publicar y reproducir "Historias"',
      'Visualizar timeline personal/terceros',
      'Publicar y comentar fotos/videos',
      'Inbox: Enviar/recibir mensajes, fotos y videos',
    ],
  },
  snapchat: {
    nombre: 'Snapchat',
    incluye: [
      'Visualizar "Snaps" personales/terceros',
      'Publicar y Comentar "Snaps"',
      'Reproducir "Historias" o "Memorias"',
      'Enviar/recibir mensajes de texto, fotos o vídeos',
    ],
  },
  uber: {
    nombre: 'Uber',
    incluye: [
      'Uso para cliente y conductor',
      'Ingresar app y solicitar servicio',
      'Seguir trayecto en tiempo real',
      'Consultar/actualizar opciones de pago',
      'Ver historial de viajes y promociones',
    ],
  },
};
