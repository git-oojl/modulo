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
  api: 'Verificando API',
  database: 'Verificando PostgreSQL',
  detail: 'La interfaz continúa disponible mientras se comprueba el entorno.',
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
        api: response.ok ? 'API disponible' : `API respondió ${response.status}`,
        database: databaseOnline ? 'PostgreSQL disponible' : 'PostgreSQL no disponible',
        detail: 'GET /api/v1/health/',
      });
    } catch {
      this.health.set({
        state: 'offline',
        api: 'API no disponible',
        database: 'PostgreSQL sin verificar',
        detail: 'No hubo respuesta de /api/v1/health/ en 3 segundos.',
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}
