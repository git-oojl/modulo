export interface Appointment {
  id: string;
  contactId: string;
  propertyId?: string;
  advisorId: string;
  startsAt: string;
  status: 'programada' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
}
