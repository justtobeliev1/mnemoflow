'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { MnemonicLearningStage } from '@/components/ui/mnemonic-learning-stage';
import { parseDefinition } from '@/utils/definition';
import { parseTags } from '@/utils/tags';

interface WordData {
  id: number;
  word: string;
  phonetic: string | null;
  definition: any;
  tags: string[] | null;
}

interface PageProps {
  params: { word: string };
}

export default function LearnWordPage({ params }: PageProps) {
  const decoded = decodeURIComponent(params.word);
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordData, setWordData] = useState<WordData | null>(null);

  useEffect(() => {
    const fetchWord = async () => {
      if (!session?.access_token) {
        setError('请先登录');
        setLoading(false);
        return;
      }
      setError(null);
      const cacheKey = `word:${decoded}`;
      // 先读本地缓存，提升秒开体验
      let hadCache = false;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as { ts: number; word: WordData };
          if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
            setWordData(parsed.word);
            hadCache = true;
          }
        }
      } catch {}

      if (!hadCache) setLoading(true);
      if (!hadCache) try {
        const res = await fetch(`/api/words/search/${encodeURIComponent(decoded)}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWordData(data.word);
          try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), word: data.word })); } catch {}
        } else {
          const txt = await res.text();
          setError(txt || `加载失败 (${res.status})`);
        }
      } catch (e: any) {
        setError(e?.message || '网络错误');
      } finally {
        if (!hadCache) setLoading(false);
      }
    };
    if (session) fetchWord();
  }, [decoded, session]);

  const parsedDefinitions = useMemo(() => {
    if (!wordData) return [] as { pos: string; meaning: string }[];
    return parseDefinition(wordData.definition);
  }, [wordData]);

  const parsedTags = useMemo(() => {
    if (!wordData) return [] as string[];
    return parseTags(wordData.tags);
  }, [wordData]);

  // 简化：加载与错误仅用轻提示，本页核心演示学习舞台
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        {wordData && (
          <MnemonicLearningStage
            word={wordData.word}
            wordId={wordData.id}
            phonetic={wordData.phonetic || undefined}
            definitions={parsedDefinitions}
            tags={parsedTags}
            senses={[]}
            blueprint={''}
            scenario={''}
            example={{ en: '', zh: '' }}
          />
        )}

        {/* 移除加载中文本，避免与已渲染内容并排显示 */}
        {error && (
          <div className="text-red-300 mt-4">{error}</div>
        )}
      </main>
    </div>
  );
}


