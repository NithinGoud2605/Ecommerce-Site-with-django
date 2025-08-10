export const colors = {
  brand: {
    primary: '#F5E6C8', // Champagne
    accent: '#C8A96A',  // Brass gold
    ink: '#222222',
    bg: '#FCFBF9',
  },
  neutral: {
    25: '#FCFCFB',
    50: '#FAFAF9',
    100: '#F5F5F4',
    150: '#EFEFEF',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  semantic: {
    success: '#198754',
    warning: '#e1a100',
    danger: '#d94848',
    info: '#0d6efd',
  },
  overlay: {
    soft: 'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.45) 100%)',
    hard: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)',
  },
  gradients: {
    brand: 'linear-gradient(135deg, #F5E6C8 0%, #EAD7A1 100%)',
    ink: 'linear-gradient(180deg, #222 0%, #000 100%)',
  },
};

export const typography = {
  fonts: {
    display: '"Playfair Display", serif',
    sans: 'Inter, system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
    grotesk: '"Space Grotesk", Inter, system-ui, sans-serif',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.6,
    relaxed: 1.7,
  },
  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.08em',
  },
  features: {
    tabular: 'tabular-nums',
  },
};

export const spacing = {
  base: 8,
  scale: (n) => `${n * 8}px`,
  inset: {
    section: 'min(8vw, 96px)',
  },
};

export const motion = {
  durations: { fast: 160, normal: 200, slow: 240 },
  easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
  prefersReduced: () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false,
  spring: { mass: 0.8, stiffness: 160, damping: 18 },
};

export function useReducedMotion() {
  const get = () => motion.prefersReduced();
  // Minimal hook without subscriptions; consumers can poll on mount
  return get();
}

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
};

export const shadows = {
  sm: '0 6px 16px rgba(0,0,0,0.06)',
  md: '0 12px 24px rgba(0,0,0,0.08)',
  lg: '0 24px 48px rgba(0,0,0,0.10)',
};

export const borders = {
  hairline: '1px solid ' + colors.neutral[200],
  subtle: '1px solid ' + colors.neutral[150],
};

export const zIndex = {
  dropdown: 1050,
  overlay: 1060,
  modal: 1070,
  toast: 1080,
};

export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

export const containers = {
  sm: 540,
  md: 720,
  lg: 960,
  xl: 1140,
  xxl: 1320,
};

// Build CSS variables for global theming
function toKebab(key) { return key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()); }
function flatten(obj, prefix = []) {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const path = [...prefix, k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(acc, flatten(v, path));
    } else {
      acc[path.join('-')] = v;
    }
    return acc;
  }, {});
}

export function themeToCSSVariables(theme = {}) {
  const base = {
    colors, typography, spacing, motion, radii, shadows, borders, zIndex, breakpoints, containers,
    ...theme,
  };
  const flat = flatten(base);
  const lines = Object.entries(flat).map(([k, v]) => `--${toKebab(k)}: ${typeof v === 'number' && !String(v).includes('px') ? `${v}px` : v};`);
  return `:root{${lines.join('')}}`;
}

export function applyTheme(theme = {}) {
  const css = themeToCSSVariables(theme);
  let style = document.getElementById('theme-tokens');
  if (!style) {
    style = document.createElement('style');
    style.id = 'theme-tokens';
    document.head.appendChild(style);
  }
  style.textContent = css;
}

const theme = { colors, typography, spacing, motion, radii, shadows, borders, zIndex, breakpoints, containers };
export default theme;


