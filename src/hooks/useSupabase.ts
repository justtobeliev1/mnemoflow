"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export function useSupabase() {
  const { supabase, session, loading } = useAuth();

  if (!supabase) {
    throw new Error("useSupabase must be used within an AuthProvider");
  }

  const authedFetch = useCallback((url: string, options?: RequestInit) => {
    if (loading) {
      console.warn("Auth context is loading, fetch is blocked.");
      return Promise.reject(new Error("User session is not ready."));
    }
    
    const token = session?.access_token;

    if (!token) {
      console.error("Authentication token is missing. Cannot make authenticated request.");
      return Promise.reject(new Error("Authentication token is missing."));
    }

    const headers = {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    return fetch(url, { ...options, headers });
  }, [session, loading]);

  return { supabase, authedFetch, isAuthLoading: loading };
}
