// Configuración de Branding y Logo
// Importante: Actualiza logoPath según el formato de tu logo

export const brandingConfig = {
  // ═════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DEL LOGO
  // ═════════════════════════════════════════════════════════════
  
  // Ruta del logo en la carpeta public/
  // Opciones: '/logo.svg', '/logo.png', '/logo.jpg', '/logo.webp'
  // Recomendado: SVG para máxima calidad y fondo transparente
  logoPath: '/logo.svg',
  
  // ═════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE LA MARCA
  // ═════════════════════════════════════════════════════════════
  
  // Nombre de la marca
  brandName: 'Amigo Paguitos Telcel',
  
  // Descripción corta
  tagline: 'Tu celular a la puerta de tu casa',
  
  // Colores corporativos (para referencias)
  colors: {
    primary: '#002f87',    // Azul oscuro
    secondary: '#0f49bd',  // Azul principal
    accent: '#13ec6d',     // Verde neón
    navy: '#002a5c',       // Navy footer
  },
  
  // Títulos por página
  titles: {
    home: 'Amigo Paguitos Telcel - Tu celular a domicilio',
    default: 'Amigo Paguitos Telcel',
  },
  
  // Meta tags
  meta: {
    description: 'Sistema web para la gestión de ventas de equipos celulares Telcel con entrega a domicilio',
    keywords: 'telcel, celulares, crédito, a domicilio, ventas, Amigo Paguitos',
    author: 'Amigo Paguitos Telcel',
  },
};

// ═════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═════════════════════════════════════════════════════════════

/**
 * Obtiene la ruta del logo según el formato
 * @param format - Formato del logo (svg, png, jpg, webp)
 * @returns Ruta completa del logo
 */
export const getLogoPath = (format: 'svg' | 'png' | 'jpg' | 'webp' = 'svg'): string => {
  const paths = {
    svg: '/logo.svg',
    png: '/logo.png',
    jpg: '/logo.jpg',
    webp: '/logo.webp',
  };
  return paths[format] || paths.svg;
};

/**
 * Verifica si el logo existe en el servidor
 * @returns Promise<boolean> - true si el logo existe
 */
export const logoExists = async (): Promise<boolean> => {
  try {
    const response = await fetch(brandingConfig.logoPath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export default brandingConfig;
