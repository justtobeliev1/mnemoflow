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
  const router = useRouter();
  const { session } = useAuth();
  
  const decodedWord = decodeURIComponent(params.word);
  
  const fetchWord = async () => {
    if (!session?.access_token) {
      setError('请先登录');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);
    
    try {
      const response = await fetch(`/api/words/search/${encodeURIComponent(decodedWord)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWordData(data.word);
      } else if (response.status === 404) {
        setNotFound(true);
      } else {
        const errorData = await response.json();
        // 确保error是字符串类型，避免React渲染对象错误
        const errorMessage = typeof errorData === 'string' 
          ? errorData 
          : errorData?.message || errorData?.error || '获取单词信息失败';
        setError(String(errorMessage));
      }
    } catch (err) {
      console.error('获取单词信息失败:', err);
      // 确保error是字符串类型
      const errorMessage = err instanceof Error ? err.message : '网络连接失败，请检查网络连接';
      setError(String(errorMessage));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (session) {
      fetchWord();
    }
  }, [decodedWord, session]);
  
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/'); // 如果没有历史记录，跳转到首页
    }
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
      
      {/* 主要内容区域 - 四边留白较大 */}
      <main className="relative z-10 max-w-4xl mx-auto px-8 py-12">
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
        
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className="glass-surface rounded-lg p-4 border border-red-400/30 bg-red-500/10">
              <div className="flex items-start gap-3">
                <div className="text-red-400 mt-1">⚠️</div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-300 mb-1">加载失败</h4>
                  <p className="text-sm text-red-200/80">{error}</p>
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
            <WordContent word={wordData} />
            <ActionBar word={wordData} />
          </motion.div>
        )}
      </main>
    </div>
  );
}