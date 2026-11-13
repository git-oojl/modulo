export interface PropertyRecord {
  id: string;
  title: string;
  operation: 'venta' | 'renta';
  status: 'borrador' | 'activa' | 'reservada' | 'cerrada' | 'archivada';
  isPublic: boolean;
}
