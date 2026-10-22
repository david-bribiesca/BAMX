// BAMX Guadalajara design tokens, derived from the app mockups.
export const colors = {
  primary: '#E4022E', // BAMX red
  primaryDark: '#B00124',
  primarySoft: '#FDEAEE', // light red used for selected cards / chips
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F9',
  border: '#E7E7EC',
  text: '#1C1C24',
  textMuted: '#6E6E7A',
  success: '#1BA672', // "Entregada"
  warning: '#E5A400', // "En camino"
  pending: '#8A8A96', // "Pendiente"
  white: '#FFFFFF',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Status chips used across the app (Confirmada / Entregada / En camino / Pendiente).
export const statusMeta: Record<string, { label: string; color: string }> = {
  confirmada: { label: 'Confirmada', color: colors.success },
  entregada: { label: 'Entregada', color: colors.success },
  en_camino: { label: 'En camino', color: colors.warning },
  pendiente: { label: 'Pendiente', color: colors.pending },
};
