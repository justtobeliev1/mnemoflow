"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PronunciationButton } from '@/components/PronunciationButton';
import { RotateCcw, MessageCircleQuestion, SendHorizonal, ThumbsUp, ThumbsDown } from 'lucide-react';
import { AIChatSidebar } from '@/components/ui/AIChatSidebar';
import { useMnemonic } from '@/hooks/useMnemonic';
import { renderHighlightedHtml } from '@/utils/highlight';
import { useAuth } from '@/contexts/AuthContext';
import { parseDefinition } from '@/utils/definition';

export interface DefinitionItem { pos: string; meaning: string }

export interface MnemonicLearningStageProps {
  word: string;
  phonetic?: string;
  definitions: DefinitionItem[];
  tags?: string[];
  senses: string[];
  blueprint: string;
  scenario: string;
  example: { en: string; zh: string };
  wordId?: number; // 用于 AI 问答侧边栏
}

function calculateGap(width: number) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth)
    return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export function MnemonicLearningStage(props: MnemonicLearningStageProps) {
  const { word, phonetic, definitions, tags = [], senses, blueprint, scenario, example, wordId } = props;

  // ---- Fallback: fetch dictionary defs if empty ----
  const [defs, setDefs] = useState<DefinitionItem[]>(definitions);

  useEffect(() => {
    if (definitions.length > 0) { setDefs(definitions); return; }

    const LS_KEY = `def-cache:${word}`;
    const cached = (() => {
      try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { return null; }
    })();
    if (cached && Array.isArray(cached.items) && Date.now() - cached.ts < 7*24*60*60*1000) {
      setDefs(cached.items);
      return;
    }

    fetch(`/api/words/search/${encodeURIComponent(word)}`, {
      headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : undefined,
    })
      .then(r => r.ok ? r.json() : null)
      .then(body => {
        const def = body?.word?.definition ?? null;
        const items = def ? parseDefinition(def) : [];
        if (items.length) {
          setDefs(items as any);
          try { localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), items })); } catch {}
        }
      })
      .catch(() => {});
  }, [word, definitions]);

  const [containerWidth, setContainerWidth] = useState(1200);
  const [isChatOpen, setChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [refineText, setRefineText] = useState('');

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { data: mnemonicData, isLoading: mnemonicLoading, error: mnemonicError, regenerate, meta } = useMnemonic(wordId);
  const { session } = useAuth();

  // responsive
  useEffect(() => {
    const onResize = () => {
      if (imageContainerRef.current) setContainerWidth(imageContainerRef.current.offsetWidth);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // stack transforms (left, center, right)
  function getPanelStyle(kind: 'left' | 'center' | 'right'): React.CSSProperties {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.8;
    const common: React.CSSProperties = {
      borderRadius: 24,
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
    };
    if (kind === 'center') {
      return { ...common, zIndex: 3, transform: `translateX(0px) translateY(0px) scale(1) rotateY(0deg)`, transition: 'all 0.8s cubic-bezier(.4,2,.3,1)' };
    }
    if (kind === 'left') {
      return { ...common, zIndex: 2, transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.92) rotateY(15deg)`, transition: 'all 0.8s cubic-bezier(.4,2,.3,1)', opacity: 0.9 };
    }
    return { ...common, zIndex: 2, transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.92) rotateY(-15deg)`, transition: 'all 0.8s cubic-bezier(.4,2,.3,1)', opacity: 0.9 };
  }

  const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const d of defs) {
      const key = d.pos || '—';
      if (!map[key]) map[key] = [];
      map[key].push(d.meaning);
    }
    return map;
  }, [defs]);

  const handleRegenerate = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1200);
  };

  const submitRefine = async () => {
    if (!refineText.trim()) { setShowRefine(false); return; }
    setShowRefine(false);
    setIsLoading(true);
    try {
      await regenerate(refineText.trim(), 'story');
    } finally {
      setIsLoading(false);
      setRefineText('');
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="grid gap-10 md:grid-cols-2 items-start">
        {/* Left: stacked glass cards with dictionary content in center card (narrower & taller) */}
        <div className="flex flex-col items-center">
          <div className="relative" ref={imageContainerRef} style={{ height: 440, width: '72%', perspective: 1000 }}>
            {/* back-left */}
            <div className="absolute inset-0 bg-surface/60 border border-border glass-surface" style={getPanelStyle('left')} />
            {/* back-right */}
            <div className="absolute inset-0 bg-surface/50 border border-border/60 glass-surface" style={getPanelStyle('right')} />
            {/* center card with content */}
            <div className="absolute inset-0 glass-surface p-5 md:p-6 overflow-auto" style={getPanelStyle('center')}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{word}</h1>
                  {phonetic && (
                    <div className="flex items-center gap-3 text-muted">
                      <span className="text-base">{phonetic}</span>
                      <PronunciationButton word={word} accent="US" />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {Object.entries(grouped).map(([pos, list]) => (
                    <div key={pos} className="flex items-start gap-3">
                      {pos !== '—' && <span className="text-xs md:text-sm text-muted bg-surface/30 px-2 py-1 rounded-md shrink-0">{pos}</span>}
                      <div className="space-y-1">
                        {list.map((m, i) => (
                          <p key={i} className="text-foreground/90 leading-relaxed">{m}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((t, i) => (
                      <span key={i} className="text-xs text-slate-200/90 bg-slate-600/30 border border-border/60 px-2.5 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                )}

                {/* actions inside the card bottom: icons only */}
                <div className="pt-4 flex items-center gap-3">
                  <button onClick={async () => { setIsLoading(true); try { await regenerate(); } finally { setIsLoading(false); } }} className="p-2 rounded-md bg-surface/60 border border-border hover:bg-surface/80 transition-colors" title="重新生成" aria-label="重新生成">
                    <svg className="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M612.86175 225.792q-114.090667-35.157333-232.277333 11.946667-153.429333 61.269333-206.165334 217.856-52.650667 156.586667 32.512 298.069333 85.162667 141.568 248.234667 168.277333 162.986667 26.794667 288.938667-80.213333 125.952-106.922667 126.037333-272.042667 0-20.053333 14.08-34.133333 14.165333-14.165333 34.133333-14.165333t34.133334 14.165333q14.08 14.08 14.08 34.133333 0 209.749333-159.914667 345.6-159.914667 135.850667-367.018667 101.973334-207.104-33.962667-315.306666-213.76Q16.040417 623.786667 83.027083 424.96q66.901333-198.826667 261.802667-276.650667 143.018667-57.088 280.746667-19.456l20.224 5.546667-27.221334-68.010667Q611.240417 47.701333 619.091083 29.354667q7.936-18.432 26.453334-25.770667 18.602667-7.424 37.034666 0.512 18.346667 7.936 25.685334 26.453333l76.202666 190.976q7.082667 17.749333 0.085334 35.498667-6.997333 17.834667-24.234667 25.941333l-173.397333 81.664h-0.170667q-18.005333 9.216-37.290667 2.730667-19.370667-6.570667-28.16-25.088-8.704-18.602667-1.450666-37.717333 7.338667-19.2 26.112-27.306667l0.682666-0.170667 91.989334-43.349333-25.770667-7.936z" fill="currentColor"></path></svg>
                  </button>
                  <button onClick={() => setShowRefine(true)} className="p-2 rounded-md bg-surface/60 border border-border hover:bg-surface/80 transition-colors" title="追加要求" aria-label="追加要求">
                    <svg className="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M959.533 151.507c0-0.926-0.452-2.29-0.92-3.201 0-0.459-0.437-0.919-0.437-1.37-0.467-1.371-0.919-2.75-1.838-3.661 0 0 0-0.46-0.452-0.46l-2.741-4.112s0-0.451-0.452-0.451l-3.208-3.201c-0.452-0.46-0.919-0.46-0.919-0.904-1.356-0.919-2.741-1.837-4.099-2.298h-0.452l-4.127-1.362c-0.452 0-0.904-0.46-1.37-0.46-0.919-0.459-2.29-0.459-3.646-0.459h-6.402c-1.37 0-2.741 0.459-4.112 0.919-0.466 0-0.919 0.459-1.371 0.459-0.466 0-0.918 0.444-1.37 0.444L79.983 516.119C70.388 520.691 64 529.819 64 540.786c0 10.517 5.921 20.097 15.064 25.129l253.138 126.114 22.385 178.634c1.371 10.98 9.129 20.108 19.659 22.865 2.289 0.905 5.016 0.905 7.306 0.905 8.21 0 15.983-3.662 21.467-10.501l89.557-112.394 81.797 40.659c-10.98-22.399-18.287-46.609-21.028-71.736l-55.285-27.883-91.847-45.691L872.266 247.91 788.66 485.501h58.015l111.939-320.285c0-0.461 0.468-0.927 0.468-1.379 0-0.459 0.452-0.912 0.452-1.371 0-1.83 0.467-2.733 0.467-4.112v-5.483c-0.001-0.46-0.001-0.913-0.468-1.364zM442.32 746.397l-42.044 52.543-9.596-78.123 51.64 25.58z m-89.555-105.539l-197.839-98.701 625.961-286.481-428.122 385.182z m0 0" fill="currentColor"></path><path d="M933.487 584.187c14.627 0 26.513-11.871 26.513-26.496 0-14.613-11.886-26.5-26.513-26.5H830.224c-15.066 0-26.485 10.967-26.485 26.5v103.264c0 14.625 11.872 26.497 26.485 26.497 14.625 0 26.512-11.872 26.512-26.497v-50.721c31.529 24.223 50.72 62.154 50.72 102.346 0 70.815-57.574 128.857-128.842 128.857-71.284 0-128.874-57.576-128.874-128.857 0-60.771 43.415-113.751 102.812-126.089 12.354-2.304 21.029-13.254 21.029-26.058 0-7.76-3.646-15.534-9.596-20.563-5.95-5.033-14.159-6.854-21.934-5.47-84.057 16.903-145.293 91.846-145.293 177.727 0 100.072 81.331 181.402 181.387 181.402 100.07 0 181.389-81.33 181.389-181.402 0-48.884-19.645-95.039-53.901-128.844h27.855v0.904z m0 0" fill="currentColor"></path></svg>
                  </button>
                  <button onClick={() => setChatOpen(true)} className="p-2 rounded-md bg-surface/60 border border-border text-foreground hover:bg-surface/80 transition-colors" title="AI问答" aria-label="AI问答">
                    <svg className="w-5 h-5" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M782.121161 734.870588H391.760314c-27.724298 0-50.196078-22.479812-50.196079-50.196078s22.47178-50.196078 50.196079-50.196079h340.164768v-124.249349c0-13.312 5.288659-26.077867 14.701428-35.494651l91.232376-91.236392-91.232376-91.232376a50.200094 50.200094 0 0 1-14.701428-35.494651V132.517647H157.549427v501.960784h83.393757c27.720282 0 50.196078 22.479812 50.196079 50.196079S268.663467 734.870588 240.943184 734.870588H107.353349c-27.720282 0-50.196078-22.479812-50.196078-50.196078v-602.352941C57.157271 54.597271 79.633067 32.12549 107.353349 32.12549h674.767812c27.720282 0 50.196078 22.47178 50.196078 50.196079v153.656219l112.021585 112.0256c19.608596 19.60458 19.608596 51.384722 0 70.989302l-112.021585 112.0256V684.67451c0 27.716267-22.47178 50.196078-50.196078 50.196078z" fill="currentColor"></path><path d="M327.541459 499.752157c-4.565835 0-9.203953-0.626447-13.813961-1.939577-26.656125-7.613741-42.088408-35.398275-34.474667-62.0544l42.269114-147.949929c7.613741-26.656125 35.386227-42.100455 62.0544-34.474667 26.656125 7.613741 42.088408 35.398275 34.474667 62.0544l-42.269114 147.945914c-6.300612 22.046118-26.399122 36.418259-48.240439 36.418259zM509.777318 499.752157c-4.565835 0-9.203953-0.626447-13.813961-1.939577-26.656125-7.617757-42.088408-35.398275-34.474667-62.0544l42.269114-147.949929c7.617757-26.65211 35.40229-42.092424 62.0544-34.474667 26.660141 7.613741 42.092424 35.398275 34.478682 62.0544l-42.265098 147.945914c-6.308643 22.046118-26.411169 36.418259-48.24847 36.418259z" fill="currentColor"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* actions moved inside the card bottom */}
        </div>

        {/* Right: AI mnemonic content (no frame) */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={word} variants={quoteVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
              <div className="space-y-4">
                {/* 骨架屏：生成或加载期间显示 */}
                {!mnemonicData && mnemonicLoading && (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 w-24 bg-white/10 rounded" />
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-2/3" />
                      <div className="h-4 bg-white/10 rounded w-1/2" />
                    </div>
                    <div className="h-4 w-20 bg-white/10 rounded mt-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-full" />
                      <div className="h-4 bg-white/10 rounded w-11/12" />
                      <div className="h-4 bg-white/10 rounded w-5/6" />
                    </div>
                    <div className="h-4 w-14 bg-white/10 rounded mt-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-10/12" />
                      <div className="h-4 bg-white/10 rounded w-9/12" />
                    </div>
                  </div>
                )}
                {mnemonicError && (
                  <div className="text-red-400">{mnemonicError}</div>
                )}
                {/* 新数据淡入 */}
                {mnemonicData && (
                  <>
                    <div>
                      <h3 className="text-sm text-muted mb-2">AI 词义</h3>
                      <ul className="list-disc list-inside space-y-1 text-foreground/90">
                        {(mnemonicData?.meaning ? [mnemonicData.meaning] : senses).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm text-muted mb-1">助记蓝图</h3>
                      <p className="whitespace-pre-line leading-relaxed text-foreground/90">{mnemonicData?.blueprint?.content ?? blueprint}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-muted mb-1">记忆场景</h3>
                      <p className="leading-relaxed text-foreground/90" dangerouslySetInnerHTML={{ __html: renderHighlightedHtml(mnemonicData?.scene?.content ?? scenario, mnemonicData?.scene?.highlights ?? []) }} />
                    </div>
                    <div className="pt-2">
                      <h3 className="text-sm text-muted mb-1">例句</h3>
                      <p className="text-foreground">{mnemonicData?.example?.sentence ?? example.en}</p>
                      <p className="text-muted mt-1">{mnemonicData?.example?.translation ?? example.zh}</p>
                    </div>
                    {/* 反馈按钮：在重新生成或加载中隐藏 */}
                    {!mnemonicLoading && !isLoading && (
                      <FeedbackRow wordId={wordId} mnemonicId={meta?.id} />
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* loading overlay for entire mnemonic panel (demo) */}
      {/* 取消整页转圈，仅保留上方骨架屏 */}
      {false && isLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* chat */}
      <AIChatSidebar isOpen={isChatOpen} onClose={() => setChatOpen(false)} word={word} wordId={wordId ?? 0} />

      {/* refine dialog */}
      {showRefine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRefine(false)} />
          <div className="relative w-[90vw] max-w-md rounded-xl bg-surface border border-border p-4 space-y-3">
            <h4 className="font-semibold">追加要求</h4>
            <textarea value={refineText} onChange={(e) => setRefineText(e.target.value)} rows={4} className="w-full bg-background border border-border rounded-md p-2 outline-none" placeholder="例如：更荒诞一点；我不认识**词..." />
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

export default MnemonicLearningStage;


function FeedbackRow({ wordId, mnemonicId }: { wordId?: number; mnemonicId?: number }) {
  const { session } = useAuth();
  const [submitted, setSubmitted] = useState<null | 1 | -1>(null);
  const [pending, setPending] = useState(false);
  const hasFetched = useRef(false);

  // 页面加载时恢复用户之前的投票结果
  useEffect(() => {
    if (!wordId || !session?.access_token || hasFetched.current) return;
    hasFetched.current = true;
    const q = new URLSearchParams();
    if (mnemonicId) q.set('mnemonicId', String(mnemonicId));
    fetch(`/api/mnemonics/${wordId}/feedback?${q.toString()}`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.exists) setSubmitted(d.rating === 1 ? 1 : -1); })
      .catch(() => {});
  }, [wordId, mnemonicId, session?.access_token]);

  const send = async (rating: 1 | -1) => {
    if (!wordId || !session?.access_token || pending || submitted) return;
    setPending(true);
    try {
      const res = await fetch(`/api/mnemonics/${wordId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ rating, mnemonicId }),
      });
      if (res.ok) setSubmitted(rating);
    } finally {
      setPending(false);
    }
  };

  const disabled = pending || submitted !== null || !wordId;

  return (
    <div className="pt-2 flex items-center gap-3">
      <button onClick={() => send(1)} disabled={disabled} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${submitted===1? 'border-emerald-400 text-emerald-300' : 'border-border text-muted'} ${disabled? 'cursor-not-allowed' : ''}`}>
        <ThumbsUp size={16}/> 有帮助
      </button>
      <button onClick={() => send(-1)} disabled={disabled} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${submitted===-1? 'border-rose-400 text-rose-300' : 'border-border text-muted'} ${disabled? 'cursor-not-allowed' : ''}`}>
        <ThumbsDown size={16}/> 无帮助
      </button>
      {submitted && <span className="text-xs text-muted">已提交</span>}
    </div>
  );
}

