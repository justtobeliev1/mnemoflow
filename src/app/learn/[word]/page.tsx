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
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/words/search/${encodeURIComponent(decoded)}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWordData(data.word);
        } else {
          const txt = await res.text();
          setError(txt || `加载失败 (${res.status})`);
        }
      } catch (e: any) {
        setError(e?.message || '网络错误');
      } finally {
        setLoading(false);
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
            senses={["截然不同的；迥异的", "本质上不同而难以比较的"]}
            blueprint={"dis(不) + pa(爸) + rate(同一水准/rate) → 和爸爸不是一个水准的。"}
            scenario={"想象一个分屏画面：左边是成功的银行家父亲(pa)在审阅高回报率(rate)的报告；右边是朋克乐手的儿子，在车库疯狂弹吉他。父亲摇头感叹：完全不(dis)是和爸爸(pa)在同一个水准(rate)上的人——兴趣与追求截然不同。"}
            example={{
              en: 'Their tastes in music are so disparate that they rarely attend the same concerts.',
              zh: '他们在音乐品味上截然不同，以至于很少会去同一场演出。',
            }}
          />
        )}

        {loading && (
          <div className="text-muted">加载中…</div>
        )}
        {error && (
          <div className="text-red-300 mt-4">{error}</div>
        )}
      </main>
    </div>
  );
}


