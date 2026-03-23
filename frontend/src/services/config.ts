/**
 * URL base del servidor backend.
 * En desarrollo usa el proxy de Vite ('/api' → localhost:3000), pero para
 * recursos estáticos como imágenes se necesita la URL absoluta.
 *
 * Configurable via variable de entorno VITE_BACKEND_URL en el .env del frontend.
 * Si no se define, cae al default de desarrollo.
 */
export const BACKEND_URL: string =
  import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://paguito-telcel-api.onrender.com' : 'http://localhost:3000');

/**
 * Convierte una ruta de imagen relativa en URL absoluta hacia el backend.
 * Si la imagen ya es una URL completa (externa), la devuelve tal cual.
 *
 * @example
 *   toImageUrl('/uploads/products/foto.jpg')
 *   // → 'http://localhost:3000/uploads/products/foto.jpg' (dev)
 *   // → 'https://api.tudominio.com/uploads/products/foto.jpg' (prod)
 */
export const toImageUrl = (src: string): string =>
  src.startsWith('http') ? src : `${BACKEND_URL}${src}`;
