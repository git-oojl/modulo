export type PublicPropertyOperation = 'venta' | 'renta';
export type PublicPropertyType = 'casa' | 'departamento' | 'terreno';

/** Safe, public-only property fields returned by /api/v1/public/properties/. */
export interface PublicProperty {
  id: string;
  title: string;
  operation: PublicPropertyOperation;
  type: PublicPropertyType;
  price: number;
  currency: 'MXN';
  publicLocation: string;
  bedrooms?: number;
  bathrooms?: number;
  areaM2: number;
  coverImageUrl: string;
}
