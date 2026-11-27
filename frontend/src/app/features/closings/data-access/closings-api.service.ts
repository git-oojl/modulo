import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PaginatedResponse, UserReference } from '../../../core/api/api.models';

export interface CommissionDto { id: string; percentage: string | null; amount: string | null; status: 'pendiente' | 'reportada_pagada'; }
export interface ClosingDto {
  id: string; property: string; contact: string; advisor: UserReference; operation: 'venta' | 'renta'; closed_on: string;
  amount: string; currency: string; status: 'vigente' | 'anulado'; notes: string; voided_at: string | null;
  commission: CommissionDto; property_detail?: { title: string }; contact_detail?: { name: string };
}
export interface ClosingPayload { property: string; contact: string; operation: 'venta' | 'renta'; closed_on: string; amount: string; currency?: string; notes?: string; advisor_id?: string; commission?: { percentage?: string | null; status?: CommissionDto['status'] }; }

@Injectable({ providedIn: 'root' })
export class ClosingsApiService extends ApiClientService {
  readonly resource = `${this.apiRoot}/closings`;

  list(filters: Record<string, string | undefined> = {}): Observable<PaginatedResponse<ClosingDto>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) if (value?.trim()) params = params.set(key, value.trim());
    return this.http.get<PaginatedResponse<ClosingDto>>(`${this.resource}/`, { params });
  }
  get(id: string): Observable<ClosingDto> { return this.http.get<ClosingDto>(`${this.resource}/${id}/`); }
  create(payload: ClosingPayload): Observable<ClosingDto> { return this.http.post<ClosingDto>(`${this.resource}/`, payload); }
  update(id: string, payload: Partial<ClosingPayload>): Observable<ClosingDto> { return this.http.patch<ClosingDto>(`${this.resource}/${id}/`, payload); }
  void(id: string): Observable<ClosingDto> { return this.http.post<ClosingDto>(`${this.resource}/${id}/void/`, {}); }
  updateCommission(id: string, payload: { percentage?: string | null; status?: CommissionDto['status'] }): Observable<CommissionDto> { return this.http.patch<CommissionDto>(`${this.resource}/${id}/commission/`, payload); }
}
