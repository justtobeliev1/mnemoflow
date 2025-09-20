'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface WordListWithStats {
  list_id: number;
  list_name: string;
  total_words: number;
  learned_words: number;
  new_words: number;
}

async function fetchWordListsWithStats(accessToken: string): Promise<WordListWithStats[]> {
  const res = await fetch('/api/me/word-lists/with-stats', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorBody = await res.json();
    throw new Error(errorBody?.error?.message || 'Failed to fetch word list stats');
  }

  return res.json();
}

export function useWordListsWithStats() {
  const { session } = useAuth();
  const accessToken = session?.access_token;

  return useQuery({
    queryKey: ['wordListsWithStats', accessToken],
    queryFn: () => {
      if (!accessToken) {
        return Promise.reject(new Error('Not authenticated'));
      }
      return fetchWordListsWithStats(accessToken);
    },
    enabled: !!accessToken,
  });
}
