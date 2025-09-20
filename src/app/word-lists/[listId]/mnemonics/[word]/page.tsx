"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { MnemonicLearningStage } from "@/components/ui/mnemonic-learning-stage";
import { parseDefinition } from "@/utils/definition";
import { parseTags } from "@/utils/tags";

type ListWordItem = {
  id: number; // user_word_progress id
  word_id: number;
  created_at: string;
  words: {
    id: number;
    word: string;
    definition: any;
    phonetic: string | null;
    tags: string[] | null;
  };
};

type WordEntry = {
  wordId: number;
  word: string;
  phonetic?: string;
  definitionRaw: any;
  tagsRaw: any;
};

export default function WordListMnemonicReaderPage() {
  const params = useParams();
  const router = useRouter();
  const listId = Number(params?.listId);
  const currentWordParam = decodeURIComponent(String(params?.word ?? ""));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WordEntry[]>([]);

  // read from cache first, then fetch
  useEffect(() => {
    if (!Number.isFinite(listId)) return;
    const cacheKey = `wlist:${listId}:words`;
    let hadCache = false;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { ts: number; entries: WordEntry[] };
        if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
          setItems(parsed.entries);
          hadCache = true;
          setLoading(false); // critical: show immediately when cache exists
        }
      }
    } catch {}

    if (!hadCache) setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/me/word-lists/${listId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`加载失败(${res.status})`);
        const data = await res.json();
        const listItems: ListWordItem[] = data?.words ?? [];
        const entries: WordEntry[] = listItems.map((it) => ({
          wordId: it.words.id,
          word: it.words.word,
          phonetic: it.words.phonetic ?? undefined,
          definitionRaw: it.words.definition ?? null,
          tagsRaw: it.words.tags ?? null,
        }));
        setItems(entries);
        try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), entries })); } catch {}
      } catch (e: any) {
        setError(e?.message || "网络错误");
      } finally {
        if (!hadCache) setLoading(false);
      }
    })();
  }, [listId]);

  const currentIndex = useMemo(() => {
    if (!items.length) return -1;
    const idx = items.findIndex((x) => x.word.toLowerCase() === currentWordParam.toLowerCase());
    // If not found (e.g., opened directly to a non-first word before items are ready), try to seed from URL order
    return idx;
  }, [items, currentWordParam]);

  const current = currentIndex >= 0 ? items[currentIndex] : undefined;
  const currentDefs = useMemo(() => current ? parseDefinition(current.definitionRaw ?? null) : [], [current]);
  const currentTags = useMemo(() => current ? parseTags(current.tagsRaw as any) : [], [current]);

  const goBack = () => router.push(`/word-lists/${listId}`);
  const goPrev = () => {
    if (currentIndex > 0) {
      const prev = items[currentIndex - 1];
      router.push(`/word-lists/${listId}/mnemonics/${encodeURIComponent(prev.word)}`);
    }
  };
  const goNext = () => {
    if (currentIndex >= 0 && currentIndex < items.length - 1) {
      const next = items[currentIndex + 1];
      router.push(`/word-lists/${listId}/mnemonics/${encodeURIComponent(next.word)}`);
    }
  };

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIndex, items]);

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      {/* Back button */}
      <button
        onClick={goBack}
        className="fixed top-6 left-6 z-50 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="返回单词本"
        title="返回单词本"
      >
        <svg className="w-6 h-6" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path d="M324.211517 511.805631 787.889594 73.082583c16.19422-16.630365 16.19422-43.974704 0-60.605068-16.19422-16.630365-42.495607-16.630365-58.613976 0L235.750113 479.360302c-8.647031 8.969398-12.344775 20.934917-11.719003 32.445329-0.644735 11.90863 3.071972 23.874149 11.719003 32.824585l493.506542 466.882788c16.118369 16.649327 42.438718 16.649327 58.613976 0 16.19422-17.085471 16.19422-43.974704 0-60.605068L324.211517 511.805631" fill="currentColor"></path>
        </svg>
      </button>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        {loading && (
          <div className="min-h-[60vh] flex items-center justify-center w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          </div>
        )}
        {!loading && current && (
          <div className="relative w-full max-w-[1200px] mx-auto pb-16">
            <MnemonicLearningStage
              word={current.word}
              wordId={current.wordId}
              phonetic={current.phonetic}
              definitions={currentDefs}
              tags={currentTags}
              senses={[]}
              blueprint={""}
              scenario={""}
              example={{ en: "", zh: "" }}
            />
            {/* Edge-aligned arrows within content width */}
            {items.length > 0 && currentIndex >= 0 && (
              <>
                <button
                  onClick={goPrev}
                  disabled={currentIndex <= 0}
                  className={`absolute left-0 bottom-2 z-40 text-foreground/80 hover:text-foreground transition-colors ${currentIndex<=0? 'opacity-40 cursor-not-allowed' : ''}`}
                  title="上一个"
                  aria-label="上一个"
                >
                  <svg className="w-8 h-8" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M938.666667 533.333333a21.333333 21.333333 0 0 1-21.333334 21.333334H158.166667l134.253333 134.246666a21.333333 21.333333 0 1 1-30.173333 30.173334l-170.666667-170.666667a21.333333 21.333333 0 0 1 0-30.173333l170.666667-170.666667a21.333333 21.333333 0 0 1 30.173333 30.173333L158.166667 512H917.333333a21.333333 21.333333 0 0 1 21.333334 21.333333z" fill="currentColor"></path>
                  </svg>
                </button>
                <button
                  onClick={goNext}
                  disabled={currentIndex >= items.length - 1}
                  className={`absolute right-0 bottom-2 z-40 text-foreground/80 hover:text-foreground transition-colors ${currentIndex>=items.length-1? 'opacity-40 cursor-not-allowed' : ''}`}
                  title="下一个"
                  aria-label="下一个"
                >
                  <svg className="w-8 h-8" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M85.333333 533.333333a21.333333 21.333333 0 0 0 21.333334 21.333334h759.166666l-134.253333 134.246666a21.333333 21.333333 0 0 0 30.173333 30.173334l170.666667-170.666667a21.333333 21.333333 0 0 0 0-30.173333l-170.666667-170.666667a21.333333 21.333333 0 0 0-30.173333 30.173333L865.833333 512H106.666667a21.333333 21.333333 0 0 0-21.333334 21.333333z" fill="currentColor"></path>
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
        {error && (
          <div className="text-red-300 mt-4">{error}</div>
        )}
      </main>

      {/* Removed page-edge fixed arrows; now aligned to content edges above */}
    </div>
  );
}


