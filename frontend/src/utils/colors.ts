// Mapa de colores CSS para los swatches en el catálogo
export const COLOR_MAP: Record<string, string> = {
  negro: '#1a1a1a',
  blanco: '#f5f5f5',
  plata: '#C0C0C0',
  plateado: '#C0C0C0',
  gris: '#808080',
  azul: '#2563eb',
  'azul oscuro': '#1e3a8a',
  'azul claro': '#60a5fa',
  verde: '#16a34a',
  'verde minta': '#6ee7b7',
  morado: '#7c3aed',
  violeta: '#7c3aed',
  rojo: '#dc2626',
  rosa: '#ec4899',
  dorado: '#d97706',
  amarillo: '#eab308',
  naranja: '#ea580c',
  cafe: '#92400e',
  café: '#92400e',
  beige: '#d4b896',
  titanio: '#a0a098',
  'titanio negro': '#3a3a3a',
  'titanio natural': '#a0a098',
};

export const getColorHex = (color: string): string =>
  COLOR_MAP[color.toLowerCase()] ?? '#9ca3af';
