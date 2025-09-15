"use client";
import { useMemo, useState } from 'react';
import { PronunciationButton } from '@/components/PronunciationButton';
import { AIChatSidebar } from '@/components/ui/AIChatSidebar';
import { RotateCcw, MessageCircleQuestion, SendHorizonal, ThumbsUp, ThumbsDown } from 'lucide-react';

export interface DefinitionItem {
  pos: string;
  meaning: string;
}

export interface LearningMnemonicCardProps {
  word: string;
  phonetic?: string; // 如 /ˈdɪspərət/
  definitions: DefinitionItem[]; // 已分组
  tags?: string[];
  // AI 助记内容（静态占位版本）
  senses: string[]; // ai给出的两种词义
  blueprint: string; // 【助记蓝图】
  scenario: string; // 【记忆场景】
  example: { en: string; zh: string };
}

export function LearningMnemonicCard(props: LearningMnemonicCardProps) {
  const { word, phonetic, definitions, tags = [], senses, blueprint, scenario, example } = props;

  const [isChatOpen, setChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // B区加载态（静态版本）
  const [showRefine, setShowRefine] = useState(false);
  const [refineText, setRefineText] = useState('');

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const d of definitions) {
      const key = d.pos || '—';
      if (!map[key]) map[key] = [];
      map[key].push(d.meaning);
    }
    return map;
  }, [definitions]);

  const handleRegenerate = () => {
    // 仅演示：展示加载 1.2s
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1200);
  };

  const handleRefine = () => {
    setShowRefine(true);
  };

  const submitRefine = () => {
    // 仅演示：展示加载并关闭输入
    setShowRefine(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1200);
    setRefineText('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl bg-surface/60 border border-border/60 p-6 md:p-8 shadow-xl">
      {/* A区 - 权威词典区 */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">{word}</h1>
            </div>
            {phonetic && (
              <div className="flex items-center gap-3 text-muted">
                <span className="text-lg">{phonetic}</span>
                <PronunciationButton word={word} accent="US" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            {Object.entries(grouped).map(([pos, list]) => (
              <div key={pos} className="flex items-start gap-3">
                {pos !== '—' && (
                  <span className="text-xs md:text-sm text-muted bg-surface/30 px-2 py-1 rounded-md shrink-0">{pos}</span>
                )}
                <div className="space-y-1">
                  {list.map((m, i) => (
                    <p key={i} className="text-foreground/90 leading-relaxed">{m}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((t, i) => (
                <span key={i} className="text-xs text-slate-200/90 bg-slate-600/30 border border-border/60 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          )}

          {/* 操作条：重新生成 / 追加要求 / AI问答 */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button onClick={handleRegenerate} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-surface border border-border hover:bg-surface/80 transition-colors">
              <RotateCcw size={18} />
              <span>重新生成</span>
            </button>
            <button onClick={handleRefine} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-surface border border-border hover:bg-surface/80 transition-colors">
              <SendHorizonal size={18} />
              <span>追加要求</span>
            </button>
            <button onClick={() => setChatOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <MessageCircleQuestion size={18} />
              <span>AI问答</span>
            </button>
          </div>
        </div>

        {/* B区 - AI助记区 */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 rounded-xl bg-black/30 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <div className="h-full rounded-xl bg-surface/40 border border-border/60 p-5 space-y-4">
            <div>
              <h3 className="text-sm text-muted mb-2">AI 词义</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/90">
                {senses.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm text-muted mb-1">【助记蓝图】</h3>
              <p className="whitespace-pre-line leading-relaxed text-foreground/90">{blueprint}</p>
            </div>
            <div>
              <h3 className="text-sm text-muted mb-1">【记忆场景】</h3>
              <p className="leading-relaxed text-foreground/90">{scenario}</p>
            </div>
            <div className="pt-2">
              <h3 className="text-sm text-muted mb-1">例句</h3>
              <p className="text-foreground">{example.en}</p>
              <p className="text-muted mt-1">{example.zh}</p>
            </div>

            {/* 反馈（静态禁用态） */}
            <div className="pt-2 flex items-center gap-3">
              <button disabled className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted cursor-not-allowed">
                <ThumbsUp size={16} /> 有帮助
              </button>
              <button disabled className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted cursor-not-allowed">
                <ThumbsDown size={16} /> 无帮助
              </button>
              <span className="text-xs text-muted">（MVP：仅收集，稍后接后端）</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI 问答侧边栏 */}
      <AIChatSidebar isOpen={isChatOpen} onClose={() => setChatOpen(false)} word={word} wordId={0} />

      {/* 追加要求对话框（简易） */}
      {showRefine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRefine(false)} />
          <div className="relative w-[90vw] max-w-md rounded-xl bg-surface border border-border p-4 space-y-3">
            <h4 className="font-semibold">追加要求</h4>
            <textarea value={refineText} onChange={(e) => setRefineText(e.target.value)} rows={4} className="w-full bg-background border border-border rounded-md p-2 outline-none" placeholder="例如：更搞笑一点；用科幻背景..." />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded-md border border-border" onClick={() => setShowRefine(false)}>取消</button>
              <button className="px-3 py-2 rounded-md bg-primary text-primary-foreground" onClick={submitRefine}>提交并重新生成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearningMnemonicCard;


