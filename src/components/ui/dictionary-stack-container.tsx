"use client";

import { useEffect, useMemo, useState } from 'react';
import { DictionaryStack } from '@/components/ui/dictionary-stack';
import { parseDefinition } from '@/utils/definition';
import { parseTags } from '@/utils/tags';
import { useAuth } from '@/contexts/AuthContext';
import { StackFrame } from '@/components/ui/stack-frame';

export interface DictionaryStackContainerProps {
  word: string;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

export function DictionaryStackContainer({ word }: DictionaryStackContainerProps) {
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hadCache, setHadCache] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      const cacheKey = `word:${word}`;
      // 1) localStorage 优先
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as { ts: number; word: any };
          if (Date.now() - parsed.ts < ONE_DAY) {
            setData(parsed.word);
            setHadCache(true);
          } else {
            setHadCache(false);
          }
        } else {
          setHadCache(false);
        }
      } catch { setHadCache(false); }

      // 2) 后台刷新
      setLoading(true);
      try {
        const res = await fetch(`/api/words/search/${encodeURIComponent(word)}`, {
          headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : undefined,
          cache: 'no-store',
        });
        if (!mounted) return;
        if (res.ok) {
          const body = await res.json();
          setData(body.word);
          try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), word: body.word })); } catch {}
        } else {
          const txt = await res.text();
          if (!data) setError(txt || `加载失败 (${res.status})`);
        }
      } catch (e: any) {
        if (mounted && !data) setError(e?.message || '网络错误');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [word, session?.access_token]);

  const defs = useMemo(() => data ? parseDefinition(data.definition) : [], [data]);
  const tags = useMemo(() => data ? parseTags(data.tags) : [], [data]);

  if (error) return <div className="p-4 text-rose-300">{error}</div>;

  if (!data && !hadCache) {
    // 仅在没有缓存时展示骨架
    return (
      <StackFrame>
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-8 w-40 bg-white/10 rounded" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-6 w-6 rounded-full bg-white/10" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-4/5 bg-white/10 rounded" />
            <div className="h-4 w-2/3 bg-white/10 rounded" />
            <div className="h-4 w-3/5 bg-white/10 rounded" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-14 rounded bg-white/10" />
            <div className="h-6 w-12 rounded bg-white/10" />
          </div>
        </div>
      </StackFrame>
    );
  }

  if (!data && hadCache) {
    // 极端场景：有缓存但 data 尚未 set（几乎不会出现），先不渲染骨架，避免闪烁
    return null;
  }

  return (
    <DictionaryStack
      word={data.word}
      phonetic={data.phonetic || undefined}
      definitions={defs}
      tags={tags}
    />
  );
}

export default DictionaryStackContainer;


