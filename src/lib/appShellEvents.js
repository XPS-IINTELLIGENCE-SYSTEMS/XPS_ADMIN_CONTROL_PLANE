export const APP_SHELL_NAV_EVENT = 'xps-app-shell-nav';

export function requestAppShellNavigation(detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(APP_SHELL_NAV_EVENT, { detail }));
}
