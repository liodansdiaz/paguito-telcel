/**
 * ========================================
 * SISTEMA DE DISEÑO - TOKENS JAVASCRIPT
 * ========================================
 * Este archivo экспorta los colores del tema para usar en JavaScript/TypeScript.
 * Para usar en CSS, usar las clases de Tailwind (bg-primary-500, etc.)
 * Para usar en JS, importar de este archivo.
 * 
 * Colores disponibles:
 * - brand: colores de marca originais
 * - semantic: colores con significado (primary, secondary, accent)
 * ========================================
 */

export const colors = {
  // Brand Colors - Blues
  brand: {
    50: '#e6f0ff',
    100: '#cce0ff',
    200: '#99c2ff',
    300: '#66a3ff',
    400: '#3385ff',
    500: '#0f49bd', // Principal
    600: '#0c3a97',
    700: '#092c71',
    800: '#061d4a',
    900: '#030f24',
  },
  
  // Brand Colors - Dark (Navy)
  dark: {
    500: '#002f87',
    600: '#00256b',
    700: '#001c4f',
  },
  
  // Brand Colors - Navy
  navy: {
    500: '#002a5c',
    600: '#001f43',
  },
  
  // Brand Colors - Greens (Accent)
  green: {
    50: '#e6fff0',
    100: '#ccffe1',
    200: '#99ffc3',
    300: '#66ffa5',
    400: '#33ff87',
    500: '#13ec6d', // Principal
    600: '#10bd57',
    700: '#0c8e41',
  },
  
  // Alias (legacy support)
  blue: '#0f49bd',
  darkBlue: '#002f87',
} as const;

// Semantic aliases (recomendados para usar)
export const semantic = {
  primary: colors.brand[500],
  primaryHover: colors.brand[600],
  primaryDark: colors.brand[700],
  
  secondary: colors.dark[500],
  secondaryHover: colors.dark[600],
  secondaryDark: colors.dark[700],
  
  accent: colors.green[500],
  accentHover: colors.green[600],
  accentDark: colors.green[700],
} as const;

// Common color combinations
export const state = {
  success: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
} as const;

// Export default for convenience
export default { colors, semantic, state };
