"use client";

import useSWR, { mutate } from 'swr';

type WordList = { id: number; user_id: string; name: string; created_at: string; word_count: number };

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r => r.json());

export function useWordLists() {
  const { data, error, isLoading } = useSWR('/api/me/word-lists', fetcher, { revalidateOnFocus: true });
  const lists: WordList[] = (data?.word_lists ?? []) as WordList[];

  const create = async (name: string) => {
    const key = '/api/me/word-lists';
    const optimistic = { id: -(Date.now()), user_id: '', name, created_at: new Date().toISOString(), word_count: 0 } as WordList;
    mutate(key, { word_lists: [optimistic, ...lists] }, { revalidate: false });
    try {
      const res = await fetch('/api/me/word-lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (!res.ok) {
        const body = await res.json();
        const code = body?.error?.error_code;
        throw new Error(code || body?.error?.message || 'CREATE_FAILED');
      }
      const body = await res.json();
      mutate(key, (current: any) => {
        const filtered = (current?.word_lists || []).filter((x: WordList) => x.id !== optimistic.id);
        return { word_lists: [body.word_list, ...filtered] };
      }, { revalidate: false });
      mutate(key);
      return body.word_list as WordList;
    } catch (e) {
      mutate(key); // 回滚到服务器状态
      throw e;
    }
  };

  const rename = async (id: number, name: string) => {
    const current = lists;
    mutate('/api/me/word-lists', { word_lists: current.map(x => x.id === id ? { ...x, name } : x) }, { revalidate: false });
    const res = await fetch(`/api/me/word-lists/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (!res.ok) {
      mutate('/api/me/word-lists');
      const body = await res.json();
      const code = body?.error?.error_code;
      throw new Error(code || body?.error?.message || 'RENAME_FAILED');
    }
    mutate('/api/me/word-lists');
  };

  const remove = async (id: number) => {
    const key = '/api/me/word-lists';
    const current = lists;
    // 先从缓存移除，避免回闪
    mutate(key, { word_lists: current.filter(x => x.id !== id) }, { revalidate: false });
    try {
      const res = await fetch(`/api/me/word-lists/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('DELETE_FAILED');
      // 成功后再校验一下服务器状态，但不把已删项重新塞回
      mutate(key);
    } catch (e) {
      // 失败才回滚
      mutate(key);
      throw e;
    }
  };

  return { lists, isLoading, error, create, rename, remove };
}


