'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { AppConfig } from './service';

const ConfigContext = createContext<AppConfig | null>(null);

export function ConfigProvider({
  children,
  config
}: {
  children: ReactNode;
  config: AppConfig;
}) {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return config;
}
