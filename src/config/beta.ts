export const BETA_MODE = typeof window !== 'undefined'
  && localStorage.getItem('orion-beta-mode') === 'true';
