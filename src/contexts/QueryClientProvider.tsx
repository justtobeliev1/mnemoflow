"use client";

import { QueryClient, QueryClientProvider as RqProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <RqProvider client={client}>{children}</RqProvider>;
}


