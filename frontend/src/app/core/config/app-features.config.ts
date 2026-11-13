/**
 * Feature switches are deliberately centralized. The internal application is
 * always closed; the public catalogue is a separately deployable concern.
 */
export const appFeatures = {
  publicCatalogueEnabled: false,
} as const;
