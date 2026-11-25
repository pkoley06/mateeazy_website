import React, { createContext, useContext, useEffect, useState } from 'react';
import { brandingApi } from '../api/endpoints';
import type { BrandingConfig } from '../types/api';

const defaultBranding: BrandingConfig = {
  communityEnabled: true,
  gifsEnabled: true,
};

const BrandingContext = createContext<BrandingConfig>(defaultBranding);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);

  useEffect(() => {
    brandingApi
      .get()
      .then((res) => setBranding(res))
      .catch(() => {
        // fallback to defaults if offline or endpoint unreachable
      });
  }, []);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
