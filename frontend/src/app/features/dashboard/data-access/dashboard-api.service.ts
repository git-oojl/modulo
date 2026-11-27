import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';

export interface DashboardDto { upcoming_appointments: { id: string; starts_at: string; contact: string; property: string | null; status: string }[]; pending_follow_ups: { id: string; due_at: string; contact: string; assigned_to: string; note: string }[]; properties_by_status: { status: string; count: number }[]; recent_activity: { id: string; contact: string; type: string; content: string; occurred_at: string }[]; closings: { count: number; amount: string }; }
@Injectable({ providedIn: 'root' })
export class DashboardApiService extends ApiClientService {
  get(days = 14): Observable<DashboardDto> { return this.http.get<DashboardDto>(`${this.apiRoot}/dashboard/`, { params: new HttpParams().set('days', days) }); }
}
