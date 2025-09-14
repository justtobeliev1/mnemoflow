"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ArrowLeft } from 'lucide-react';
import { ToastContainer, useToast } from "@/components/ui/toast-notification";
import useSWR, { mutate } from 'swr';

type WordItem = {
  id: number; // user_word_progress id
  word_id: number;
  created_at: string;
  words: {
    id: number;
    word: string;
    phonetic: string | null;
    tags: string[] | null;
  };
};

function WordListDetailInner() {
  const params = useParams();
  const router = useRouter();
  const listId = Number(params?.listId);
  const { success, error } = useToast();
  const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r => r.json());
  const { data, isLoading } = useSWR(`/api/me/word-lists/${listId}`, fetcher, { revalidateOnFocus: true });
  const title = data?.word_list?.name || '';
  const items: WordItem[] = data?.words || [];
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(listId)) return;
    // 由 SWR 负责
  }, [listId]);

  const removeWord = async (wordId: number) => {
    // 乐观移除
    const key = `/api/me/word-lists/${listId}`;
    mutate(key, { ...data, words: items.filter(x => x.word_id !== wordId) }, { revalidate: false });
    setBusy(wordId);
    const res = await fetch(`/api/me/words/${wordId}`, { method: "DELETE" });
    if (!res.ok) {
      mutate(key);
      const msg = (await res.json()).error?.message ?? "移除失败";
      error(msg);
    } else {
      success("已移除");
      mutate(key);
    }
    setBusy(null);
  };

  return (
    <div className="min-h-screen">
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/word-lists')} className="p-2 rounded-lg hover:bg-surface/60 text-foreground">
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl font-bold text-foreground">{title || "单词本"}</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="text-muted">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-muted">暂无单词</div>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg overflow-hidden glass-surface">
            {items.map((it) => (
              <li key={it.word_id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-foreground font-medium">{it.words.word}</span>
                  {it.words.phonetic && (
                    <span className="text-muted text-sm">{it.words.phonetic}</span>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => removeWord(it.word_id)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300"
                  >移除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default function WordListDetailPage() {
  return (
    <AuthGuard>
      <WordListDetailInner />
    </AuthGuard>
  );
}


