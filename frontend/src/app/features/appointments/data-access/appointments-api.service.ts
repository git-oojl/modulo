import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PaginatedResponse, UserReference } from '../../../core/api/api.models';

export interface AppointmentDto {
  id: string;
  contact: string;
  property: string | null;
  advisor: UserReference;
  source: string | null;
  purpose: 'visita' | 'captacion' | 'cierre' | 'otro';
  status: 'programada' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  starts_at: string;
  ends_at: string | null;
  result: string;
  notes: string;
  contact_detail?: { name: string };
  property_detail?: { title: string } | null;
}

export interface AppointmentPayload {
  contact: string;
  property?: string | null;
  source?: string | null;
  purpose: AppointmentDto['purpose'];
  status?: AppointmentDto['status'];
  starts_at: string;
  ends_at?: string | null;
  notes?: string;
  advisor_id?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsApiService extends ApiClientService {
  readonly resource = `${this.apiRoot}/appointments`;

  list(filters: Record<string, string | undefined> = {}): Observable<PaginatedResponse<AppointmentDto>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) if (value?.trim()) params = params.set(key, value.trim());
    return this.http.get<PaginatedResponse<AppointmentDto>>(`${this.resource}/`, { params });
  }
  get(id: string): Observable<AppointmentDto> { return this.http.get<AppointmentDto>(`${this.resource}/${id}/`); }
  create(payload: AppointmentPayload): Observable<AppointmentDto> { return this.http.post<AppointmentDto>(`${this.resource}/`, payload); }
  update(id: string, payload: Partial<AppointmentPayload>): Observable<AppointmentDto> { return this.http.patch<AppointmentDto>(`${this.resource}/${id}/`, payload); }
  cancel(id: string): Observable<void> { return this.http.delete<void>(`${this.resource}/${id}/`); }
  complete(id: string, payload: { result: string; next_follow_up_at?: string | null; follow_up_note?: string }): Observable<AppointmentDto> { return this.http.post<AppointmentDto>(`${this.resource}/${id}/complete/`, payload); }
  icsUrl(id: string): string { return `${this.resource}/${id}/ics/`; }
}
