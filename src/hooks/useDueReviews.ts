"use client";

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export type DueReviewItem = {
  word_id: number;
  word: string;
  compressed_definition: string | null;
  due: string;
  stability: number | null;
  difficulty: number | null;
};

export function useDueReviews(limit: number = 100) {
  const { session } = useAuth();
  const enabled = !!session?.access_token;

  return useQuery<{ reviews: DueReviewItem[] }, Error>({
    queryKey: ['due-reviews', limit, session?.access_token],
    enabled,
    queryFn: async () => {
      const res = await fetch(`/api/me/reviews/due-list?limit=${limit}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: !!session?.access_token,
  });
}


