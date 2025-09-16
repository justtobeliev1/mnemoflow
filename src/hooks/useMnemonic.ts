"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

export type MnemonicContent = {
  word?: string;
  meaning?: string;
  blueprint?: { title: string; content: string };
  scene?: { title: string; content: string; highlights?: string[] };
  example?: { title: string; sentence: string; translation: string };
  raw?: string;
  error?: string;
} | null;

type UseMnemonicOptions = {
  timeoutMs?: number; // 单次轮询的服务端等待
  pollIntervalMs?: number; // 202 后客户端等待间隔
};

export function useMnemonic(wordId: number | undefined, opts: UseMnemonicOptions = {}) {
  const timeoutMs = opts.timeoutMs ?? 60000;
  const pollIntervalMs = opts.pollIntervalMs ?? 1500;

  const [data, setData] = useState<MnemonicContent>(null);
  const [meta, setMeta] = useState<{ id: number; version: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef(false);

  // 简易本地缓存（localStorage），键以 wordId 区分
  const cacheKey = wordId ? `mnemo:${wordId}` : '';

  const readCache = (): MnemonicContent | null => {
    if (!cacheKey) return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { ts: number; content: MnemonicContent };
      if (Date.now() - parsed.ts >7 * 24 * 60 * 60 * 1000) return null; // 7d TTL
      return parsed.content;
    } catch {
      return null;
    }
  };

  const writeCache = (value: any) => {
    if (!cacheKey) return;
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), content: value }));
    } catch {}
  };

  const fetchOnce = useCallback(async () => {
    if (!wordId) return;
    setError(null);
    try {
      // 先用本地缓存秒开
      const cached = readCache();
      if (cached) {
        setData(cached);
        return 'DONE' as const;
      }

      const res = await fetch(`/api/mnemonics/${wordId}?timeout=${timeoutMs}`, { cache: 'no-store' });
      if (res.status === 202) {
        return 'PENDING' as const;
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `获取失败(${res.status})`);
      }
      const body = await res.json();
      const content = body?.mnemonic?.content ?? null;
      const id = body?.mnemonic?.id;
      const version = body?.mnemonic?.version;
      setData(content);
      if (id && version) setMeta({ id, version });
      if (content) writeCache(content);
      return 'DONE' as const;
    } catch (e: any) {
      setError(e?.message || '网络错误');
      return 'ERROR' as const;
    } finally {
      // loading 状态由外层 load 管控，避免闪烁
    }
  }, [wordId, timeoutMs]);

  const load = useCallback(async () => {
    if (!wordId) return;
    stopRef.current = false;
    setIsLoading(true);
    // 最多轮询 5 轮（每轮服务端最多 timeoutMs）
    for (let i = 0; i < 5 && !stopRef.current; i++) {
      const r = await fetchOnce();
      if (r === 'DONE' || r === 'ERROR') { setIsLoading(false); return; }
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
    setIsLoading(false);
  }, [wordId, fetchOnce, pollIntervalMs]);

  const regenerate = useCallback(async (userContext?: string, type?: string) => {
    if (!wordId) return false;
    setIsLoading(true);
    setData(null);
    setMeta(null);
    setError(null);
    try {
      const res = await fetch(`/api/mnemonics/${wordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_context: userContext, type }),
      });
      if (!res.ok) throw new Error(await res.text());
      // 重新生成前清理旧缓存，避免看到旧数据
      if (cacheKey) localStorage.removeItem(cacheKey);
      await load();
      return true;
    } catch (e: any) {
      setError(e?.message || '重新生成失败');
      return false;
    } finally {
      // load 会关闭 loading
    }
  }, [wordId, load]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { stopRef.current = true; }, []);

  return { data, isLoading, error, reload: load, regenerate, meta };
}


