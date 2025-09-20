"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ToastContainer, useToast } from "@/components/ui/toast-notification";
import useSWR, { mutate } from 'swr';
import { PronunciationButton } from '@/components/PronunciationButton';
import { parseDefinition } from '@/utils/definition';

type WordItem = {
  id: number; // user_word_progress id
  word_id: number;
  created_at: string;
  words: {
    id: number;
    word: string;
    definition: string | null;
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

  const truncateDefinition = (def: any): string => {
    if (!def) return '';
    if (typeof def === 'string') {
      // 有的来源是字面 "\\n"，有的是实际换行，双重兼容
      const byLiteral = def.split('\\n')[0];
      if (byLiteral && byLiteral !== def) return byLiteral;
      return def.split('\n')[0] || '';
    }
    const parsed = parseDefinition(def);
    return parsed.length ? parsed[0].meaning : '';
  };

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
        {!isLoading && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/word-lists')} className="p-2 rounded-lg hover:bg-surface/60 text-foreground" title="返回">
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted">暂无单词</div>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg overflow-hidden glass-surface">
            {items.map((it) => (
              <li
                key={it.word_id}
                className="px-4 py-3 cursor-pointer hover:bg-surface/40"
                onClick={() => router.push(`/word-lists/${listId}/mnemonics/${encodeURIComponent(it.words.word)}`)}
                title="查看助记卡片"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-foreground font-medium text-lg">{it.words.word}</span>
                    {it.words.phonetic && (
                      <span className="text-muted text-sm">{it.words.phonetic}</span>
                    )}
                    <PronunciationButton word={it.words.word} className="ml-1" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeWord(it.word_id); }}
                    disabled={busy === it.word_id}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-300"
                    title="移除"
                  >
                    {busy === it.word_id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M254.398526 804.702412l-0.030699-4.787026C254.367827 801.546535 254.380106 803.13573 254.398526 804.702412zM614.190939 259.036661c-22.116717 0-40.047088 17.910928-40.047088 40.047088l0.37146 502.160911c0 22.097274 17.930371 40.048111 40.047088 40.048111s40.048111-17.950837 40.048111-40.048111l-0.350994-502.160911C654.259516 276.948613 636.328122 259.036661 614.190939 259.036661zM893.234259 140.105968l-318.891887 0.148379-0.178055-41.407062c0-22.13616-17.933441-40.048111-40.067554-40.048111-7.294127 0-14.126742 1.958608-20.017916 5.364171-5.894244-3.405563-12.729929-5.364171-20.031219-5.364171-22.115694 0-40.047088 17.911952-40.047088 40.048111l0.188288 41.463344-230.115981 0.106424c-3.228531-0.839111-6.613628-1.287319-10.104125-1.287319-3.502777 0-6.89913 0.452301-10.136871 1.296529l-73.067132 0.033769c-22.115694 0-40.048111 17.950837-40.048111 40.047088 0 22.13616 17.931395 40.048111 40.048111 40.048111l43.176358-0.020466 0.292666 617.902982 0.059352 0 0 42.551118c0 44.233434 35.862789 80.095199 80.095199 80.095199l40.048111 0 0 0.302899 440.523085-0.25685 0-0.046049 40.048111 0c43.663452 0 79.146595-34.95 80.054267-78.395488l-0.329505-583.369468c0-22.135136-17.930371-40.047088-40.048111-40.047088-22.115694 0-40.047088 17.911952-40.047088 40.047088l0.287549 509.324054c-1.407046 60.314691-18.594497 71.367421-79.993892 71.367421l41.575908 1.022283-454.442096 0.26606 52.398394-1.288343c-62.715367 0-79.305207-11.522428-80.0645-75.308173l0.493234 76.611865-0.543376 0-0.313132-660.818397 236.82273-0.109494c1.173732 0.103354 2.360767 0.166799 3.561106 0.166799 1.215688 0 2.416026-0.063445 3.604084-0.169869l32.639375-0.01535c1.25355 0.118704 2.521426 0.185218 3.805676 0.185218 1.299599 0 2.582825-0.067538 3.851725-0.188288l354.913289-0.163729c22.115694 0 40.050158-17.911952 40.050158-40.047088C933.283394 158.01792 915.349953 140.105968 893.234259 140.105968zM774.928806 815.294654l0.036839 65.715701-0.459464 0L774.928806 815.294654zM413.953452 259.036661c-22.116717 0-40.048111 17.910928-40.048111 40.047088l0.37146 502.160911c0 22.097274 17.931395 40.048111 40.049135 40.048111 22.115694 0 40.047088-17.950837 40.047088-40.048111l-0.37146-502.160911C454.00054 276.948613 436.069145 259.036661 413.953452 259.036661z" fill="#d81e06"/></svg>
                    )}
                  </button>
                </div>
                {truncateDefinition(it.words.definition) && (
                  <div className="mt-1 text-sm text-muted">
                    {truncateDefinition(it.words.definition)}
                  </div>
                )}
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


