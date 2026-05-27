// Sucursales ACXOCEL - Tapachula, Chiapas

export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  horario: string;
  googleMapsUrl: string;
  lat: number;
  lng: number;
}

export const sucursales: Sucursal[] = [
  {
    id: 'galerias',
    nombre: 'Plaza Las Galerías',
    direccion: 'K.M. 2.5, Carretera Tapachula a, Carr. a Puerto Madero, 30797 Tapachula, Chiapas',
    telefono: '9994106182',
    whatsapp: '529994106182',
    horario: 'Consultar horarios de la plaza',
    googleMapsUrl: 'https://maps.google.com/?q=14.9067,-92.2614',
    lat: 14.9067,
    lng: -92.2614,
  },
  {
    id: 'torres',
    nombre: 'Plaza Las Torres',
    direccion: 'Calz. Las Palmas 1, 30700 Tapachula de Córdova y Ordóñez, Chiapas',
    telefono: '9994106182',
    whatsapp: '529994106182',
    horario: 'Consultar horarios de la plaza',
    googleMapsUrl: 'https://maps.google.com/?q=14.9050,-92.2590',
    lat: 14.9050,
    lng: -92.2590,
  },
];

// Datos de contacto general
export const contactoGeneral = {
  telefono: '9994106182',
  whatsapp: '529994106182',
  email: 'contacto@acxocel.com.mx',
  emailRH: 'reclutamiento@acxocel.com.mx',
  horarioAtencion: 'De lunes a Viernes de 9:00 a 18:00 hrs. Sábados de 9:00 a 15:00 hrs.',
  redesSociales: {
    facebook: 'https://facebook.com/acxocel',
    instagram: 'https://instagram.com/acxocel',
    twitter: 'https://twitter.com/acxocel',
  },
};
