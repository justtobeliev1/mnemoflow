'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { WordDetailHeader } from '@/components/WordDetailHeader';
import { WordContent } from '@/components/WordContent';  
import { ActionBar } from '@/components/ActionBar';
import { WordLoadingState, WordNotFound, WordErrorState } from '@/components/WordLoadingState';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { AIChatSidebar } from '@/components/ui/AIChatSidebar';
import { motion } from 'framer-motion';

interface WordData {
  id: number;
  word: string;
  phonetic: string | null;
  definition: any;
  tags: string[] | null;
  created_at: string;
}

interface WordDetailPageProps {
  params: {
    word: string;
  };
}

export default function WordDetailPage({ params }: WordDetailPageProps) {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [hasFreshCache, setHasFreshCache] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const router = useRouter();
  const { session } = useAuth();
  
  const decodedWord = decodeURIComponent(params.word);

  // ===== 本地缓存读取（首屏同步，避免闪烁） =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`word:${decodedWord}`);
      if (raw) {
        const cached = JSON.parse(raw) as { ts: number; word: WordData };
        if (Date.now() - cached.ts < 7 * 24 * 60 * 60 * 1000) {
          // 若尚未设置数据，立即填充，避免出现 loading
          setWordData((prev) => prev ?? cached.word);
          setHasFreshCache(true);
          setLoading((prev) => (prev && !prev ? prev : false));
        }
      }
    } catch {}
  }, [decodedWord]);
  
  const fetchWord = async () => {
    if (!session?.access_token) {
      setError('请先登录');
      setLoading(false);
      return;
    }

    // 若已有缓存展示，不重复显示 loading
    if (hasFreshCache) return; // 已有最新缓存，不请求
    if (!wordData) setLoading(true);
    setError(null);
    setNotFound(false);
    
    try {
      const response = await fetch(`/api/words/search/${encodeURIComponent(decodedWord)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWordData(data.word);
        // 写缓存
        try {
          localStorage.setItem(`word:${decodedWord}`, JSON.stringify({ ts: Date.now(), word: data.word }));
        } catch {}
      } else if (response.status === 404) {
        setNotFound(true);
      } else if (response.status === 401) {
        setError('登录已过期，请重新登录');
      } else {
        const errorData = await response.json().catch(() => ({ message: '请求失败' }));
        const errorMessage = errorData?.message || errorData?.error || `请求失败 (${response.status})`;
        setError(String(errorMessage));
      }
    } catch (err) {
      console.error('获取单词信息失败:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('网络连接失败，请检查网络连接');
      } else {
        setError('请求失败，请重试');
      }
    } finally {
      if (!wordData) setLoading(false);
    }
  };
  
  useEffect(() => {
    if (session) {
      fetchWord();
    }
  }, [decodedWord, session]);
  
  const handleBack = () => {
    // 直接返回到主页
    router.push('/');
  };
  
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* 复用主页的动画背景 */}
      <AnimatedBackground />
      
      {/* 页面头部 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20"
      >
        <WordDetailHeader 
          onBack={handleBack}
          currentWord={decodedWord}
        />
      </motion.div>
      
      {/* 主要内容区域 - 上下居中 */}
      <main className="relative z-10 max-w-4xl mx-auto px-8 min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="w-full">
          {loading && (
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8 }}
            >
              <WordLoadingState />
            </motion.div>
          )}
          
          {notFound && (
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8 }}
            >
              <WordNotFound word={decodedWord} />
            </motion.div>
          )}
          
          {wordData && (
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <WordContent 
                word={wordData} 
                onAIChatClick={() => setIsChatOpen(true)} 
              />
            </motion.div>
          )}
        </div>
      </main>

      {wordData && (
        <AIChatSidebar 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          word={decodedWord}
          wordId={wordData.id}
        />
      )}

      {/* 错误提示 - 页面底部居中 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4"
        >
          <div className="glass-surface-no-border rounded-lg p-4 bg-red-500/20">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-300 mb-1">加载失败</h4>
                <p className="text-sm text-red-200/80">
                  {typeof error === 'string' ? error : '网络连接失败，请重试'}
                </p>
                <button
                  onClick={fetchWord}
                  className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
                >
                  重试
                </button>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-300/60 hover:text-red-300 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}