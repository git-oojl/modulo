import { isDevMode } from '@angular/core';
import { UserRole } from './auth.models';

export type DevelopmentMode = 'normal' | 'preview';
export type PreviewViewer = UserRole | 'publico';

export interface DevelopmentPreviewState {
  mode: DevelopmentMode;
  viewer: PreviewViewer;
}

const storageKey = 'modulo.development-preview';
const defaultState: DevelopmentPreviewState = { mode: 'normal', viewer: 'administrador' };
const validViewers: readonly PreviewViewer[] = ['asesor', 'gerencia', 'administrador', 'publico'];

/**
 * Preview is a local development convenience, but it should survive a browser
 * reload while a developer is inspecting routes. It is never read in a
 * production build and does not represent a Django session.
 */
export function readDevelopmentPreviewState(): DevelopmentPreviewState {
  if (!isDevMode() || typeof sessionStorage === 'undefined') {
    return defaultState;
  }

  try {
    const stored = JSON.parse(
      sessionStorage.getItem(storageKey) ?? '',
    ) as Partial<DevelopmentPreviewState>;
    if (
      (stored.mode === 'normal' || stored.mode === 'preview') &&
      stored.viewer !== undefined &&
      validViewers.includes(stored.viewer)
    ) {
      return { mode: stored.mode, viewer: stored.viewer };
    }
  } catch {
    // An unavailable or malformed browser storage value must not affect the app.
  }

  return defaultState;
}

export function writeDevelopmentPreviewState(state: DevelopmentPreviewState): void {
  if (!isDevMode() || typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Private browsing or restricted storage only disables persistence.
  }
}
