import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';

export interface PublicAccessRequestPayload { name: string; email: string; phone: string; requested_role: 'asesor' | 'gerencia' | 'administrador'; comments?: string; privacy_accepted: boolean; }

@Injectable({ providedIn: 'root' })
export class AccessRequestApiService extends ApiClientService {
  create(payload: PublicAccessRequestPayload): Observable<{ id: string }> { return this.http.post<{ id: string }>(`${this.apiRoot}/auth/access-requests/`, payload); }
}
