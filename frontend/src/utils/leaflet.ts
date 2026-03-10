import L from 'leaflet';

// Fix para los iconos por defecto de Leaflet que no funcionan bien con bundlers
// Elimina el método que intenta cargar las URLs de forma旧的
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Configura las URLs correctas de los iconos
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default L;
