// Configuración del Logo
// IMPORTANTE: Cambia las rutas según el formato de tu logo

export const logoConfig = {
  // Ruta al logo principal
  // Opciones: '/logo.svg', '/logo.png', '/logo.jpg', '/logo.webp'
  mainLogo: '/logo.svg',
  
  // Ruta al logo para favicon (pequeño)
  // Puedes usar el mismo o uno diferente
  faviconLogo: '/logo.svg',
  
  // Nombre de la marca (para alt text y accesibilidad)
  brandName: 'Amigo Paguitos Telcel',
  
  // Tamaños disponibles para el logo
  sizes: {
    small: 'w-8 h-8',      // Íconos pequeños
    medium: 'w-10 h-10',   // Headers, botones
    large: 'w-16 h-16',    // Hero, landing
    xlarge: 'w-24 h-24',   // Centros grandes
  },
};

// Función para obtener la ruta del logo según el formato
export const getLogoPath = (format: 'svg' | 'png' | 'jpg' = 'svg'): string => {
  const paths = {
    svg: '/logo.svg',
    png: '/logo.png',
    jpg: '/logo.jpg',
  };
  return paths[format] || paths.svg;
};

// Función para verificar si el logo existe
export const logoExists = async (): Promise<boolean> => {
  try {
    const response = await fetch(logoConfig.mainLogo, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export default logoConfig;
