/**
 * ════════════════════════════════════════════════════════════════════════════
 * CONFIGURACIÓN DE MARCA Y LOGO
 * ════════════════════════════════════════════════════════════════════════════
 * Este archivo consolidate branding y configuracion del logo.
 * Antiguos archivos: branding.ts, logo-config.ts
 * ════════════════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL LOGO
// ════════════════════════════════════════════════════════════════════════════

export const logoConfig = {
  /** Ruta al logo principal - puede ser URL externa o ruta local */
  mainLogo: 'https://res.cloudinary.com/dq4mwiut5/image/upload/v1775375372/LOGO_AMIGO_PAGUITOS_azul_rgb_Horizontal2-2_akxj8i.webp',
  
  /** Ruta al favicon */
  faviconLogo: '/logo.svg',
  
  /** Nombre de la marca */
  brandName: 'Amigo Paguitos Telcel',
  
  /** Tagline */
  tagline: 'Tu celular a la puerta de tu casa',
  
  /** Tamaños disponibles */
  sizes: {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24',
  },
};

/**
 * Obtiene la ruta del logo según el formato
 */
export const getLogoPath = (format: 'svg' | 'png' | 'jpg' = 'svg'): string => {
  const paths = { svg: '/logo.svg', png: '/logo.png', jpg: '/logo.jpg' };
  return paths[format] || paths.svg;
};

/**
 * Verifica si el logo existe en el servidor
 */
export const logoExists = async (): Promise<boolean> => {
  try {
    const response = await fetch(logoConfig.mainLogo, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// ════════════════════════════════════════════════════════════════════════════
// METADATA
// ════════════════════════════════════════════════════════════════════════════

export const metaConfig = {
  titles: {
    home: 'Amigo Paguitos Telcel - Tu celular a domicilio',
    default: 'Amigo Paguitos Telcel',
  },
  meta: {
    description: 'Sistema web para la gestión de ventas de equipos celulares Telcel con entrega a domicilio',
    keywords: 'telcel, celulares, crédito, a domicilio, ventas, Amigo Paguitos',
    author: 'Amigo Paguitos Telcel',
  },
};

export default logoConfig;