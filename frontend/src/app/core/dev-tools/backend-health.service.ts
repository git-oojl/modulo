import { Injectable, signal } from '@angular/core';

export type BackendHealthState = 'checking' | 'online' | 'degraded' | 'offline';

export interface BackendHealth {
  state: BackendHealthState;
  api: string;
  database: string;
  detail: string;
}

const initialHealth: BackendHealth = {
  state: 'checking',
  api: 'Comprobando',
  database: 'Comprobando',
  detail: 'GET /api/v1/health/',
};

@Injectable({ providedIn: 'root' })
export class BackendHealthService {
  readonly health = signal<BackendHealth>(initialHealth);

  async refresh(): Promise<void> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3_000);
    this.health.set(initialHealth);

    try {
      const response = await fetch('/api/v1/health/', {
        cache: 'no-store',
        signal: controller.signal,
      });
      const payload = (await response.json()) as { status?: string; database?: string };
      const databaseOnline = payload.database === 'ok';

      this.health.set({
        state: response.ok && databaseOnline ? 'online' : 'degraded',
        api: response.ok ? 'OK' : `Error ${response.status}`,
        database: databaseOnline ? 'OK' : 'No disponible',
        detail: 'GET /api/v1/health/',
      });
    } catch {
      this.health.set({
        state: 'offline',
        api: 'No disponible',
        database: 'Sin verificar',
        detail: 'No hubo respuesta de /api/v1/health/ en 3 segundos.',
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}
