import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PaginatedResponse, UserReference } from '../../../core/api/api.models';

export interface ContactActivityDto {
  id: string;
  type: string;
  content: string;
  occurred_at: string;
  created_by: UserReference | null;
  created_at: string;
}

export interface PropertyInterestDto {
  id: string;
  property_id?: string;
  note: string;
  created_at: string;
}

export interface FollowUpDto {
  id: string;
  assigned_to: UserReference;
  due_at: string;
  status: 'pendiente' | 'completado';
  note: string;
  completed_at: string | null;
}

export interface ContactDto {
  id: string;
  name: string;
  phone: string;
  email: string;
  advisor: UserReference | null;
  source: string | null;
  source_name: string;
  status: 'prospecto' | 'cliente_activo' | 'cliente_cerrado' | 'perdido' | 'inactivo';
  notes: string;
  activities: ContactActivityDto[];
  interests: PropertyInterestDto[];
  follow_ups: FollowUpDto[];
  created_at: string;
  updated_at: string;
}

export interface ContactPayload {
  name: string;
  phone: string;
  email?: string;
  source?: string | null;
  status?: ContactDto['status'];
  notes?: string;
  advisor_id?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ContactsApiService extends ApiClientService {
  readonly resource = `${this.apiRoot}/contacts`;

  list(filters: Record<string, string | undefined> = {}): Observable<PaginatedResponse<ContactDto>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value?.trim()) params = params.set(key, value.trim());
    }
    return this.http.get<PaginatedResponse<ContactDto>>(`${this.resource}/`, { params });
  }

  get(id: string): Observable<ContactDto> {
    return this.http.get<ContactDto>(`${this.resource}/${id}/`);
  }

  create(payload: ContactPayload): Observable<ContactDto> {
    return this.http.post<ContactDto>(`${this.resource}/`, payload);
  }

  update(id: string, payload: Partial<ContactPayload>): Observable<ContactDto> {
    return this.http.patch<ContactDto>(`${this.resource}/${id}/`, payload);
  }

  archive(id: string): Observable<void> {
    return this.http.delete<void>(`${this.resource}/${id}/`);
  }

  addActivity(id: string, payload: Pick<ContactActivityDto, 'type' | 'content' | 'occurred_at'>): Observable<ContactActivityDto> {
    return this.http.post<ContactActivityDto>(`${this.resource}/${id}/activities/`, payload);
  }

  addInterest(id: string, propertyId: string, note = ''): Observable<PropertyInterestDto> {
    return this.http.post<PropertyInterestDto>(`${this.resource}/${id}/interests/`, { property_id: propertyId, note });
  }

  addFollowUp(id: string, payload: { due_at: string; note?: string; assigned_to_id?: string }): Observable<FollowUpDto> {
    return this.http.post<FollowUpDto>(`${this.resource}/${id}/follow-ups/`, payload);
  }

  completeFollowUp(id: string, followUpId: string): Observable<FollowUpDto> {
    return this.http.post<FollowUpDto>(`${this.resource}/${id}/follow-ups/${followUpId}/complete/`, {});
  }
}
