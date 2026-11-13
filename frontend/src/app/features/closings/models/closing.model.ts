export interface Closing {
  id: string;
  propertyId: string;
  contactId: string;
  advisorId: string;
  amount: string;
  currency: string;
  status: 'vigente' | 'anulado';
}
