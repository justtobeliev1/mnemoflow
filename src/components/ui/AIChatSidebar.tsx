'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSupabase } from '@/hooks/useSupabase';

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  wordId: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function buildSuggestions(word: string): string[] {
  return [
    `请用 "${word}" 造一个例句，并给出中文解释。`,
    `"${word}" 的近义词/同义词有哪些？有什么细微差别？`,
    `"${word}" 常见搭配与固定短语有哪些？请给例句。`,
    `在不同语境中 "${word}" 的含义与用法有什么区别？`,
  ];
}

const getLocalKey = (wordId: number) => `mf_chat_${wordId}`;

export function AIChatSidebar({ isOpen, onClose, word, wordId }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasFirstChunk, setHasFirstChunk] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { authedFetch } = useSupabase();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isStreaming, hasFirstChunk]);
  
  const readLocal = (): Message[] | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(getLocalKey(wordId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Message[];
      return null;
    } catch {
      return null;
    }
  };

  const writeLocal = (data: Message[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getLocalKey(wordId), JSON.stringify(data));
    } catch {}
  };

  const fetchHistory = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    try {
      const response = await authedFetch(`/api/me/chat-history?wordId=${wordId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.conversation_log) {
          const list: Message[] = data.conversation_log;
          setMessages(list);
          writeLocal(list);
          const hasUserMsg = list.some(m => m.role === 'user');
          setShowSuggestions(!hasUserMsg && list.length <= 1);
          return;
        }
      }
      // 服务端无数据时，尝试本地缓存
      const local = readLocal();
      if (local) {
        setMessages(local);
        const hasUserMsg = local.some(m => m.role === 'user');
        setShowSuggestions(!hasUserMsg && local.length <= 1);
      } else {
        const greeting: Message = { role: 'assistant', content: `你好！我是你的英语学习助手。关于单词 "${word}"，有什么可以帮你吗？` };
        setMessages([greeting]);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      // 网络失败时，优先本地缓存回退
      const local = readLocal();
      if (local) {
        setMessages(local);
        const hasUserMsg = local.some(m => m.role === 'user');
        setShowSuggestions(!hasUserMsg && local.length <= 1);
      } else {
        const fallback: Message = { role: 'assistant', content: `你好！我是你的英语学习助手。关于单词 "${word}"，有什么可以帮你吗？` };
        setMessages([fallback]);
        setShowSuggestions(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, wordId, word, authedFetch]);

  useEffect(() => {
    fetchHistory();
  }, [isOpen, fetchHistory]);

  const saveHistoryWithRetry = async (updatedMessages: Message[]) => {
    writeLocal(updatedMessages);
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const resp = await authedFetch('/api/me/chat-history', {
          method: 'POST',
          body: JSON.stringify({ wordId, messages: updatedMessages }),
        });
        if (resp.ok) return;
        // 非 2xx 也重试
      } catch (e) {
        // 网络异常重试
      }
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt))); // 500ms, 1000ms, 2000ms
    }
  };

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;
    setShowSuggestions(false);

    const newMessages: Message[] = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);

    setIsLoading(true);
    setIsStreaming(true);
    setHasFirstChunk(false);

    let finalAssistantMessage = '';

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, prompt }),
      });

      const contentType = response.headers.get('content-type');

      // 上游可能返回 404 HTML 等，若 content-type 非 text/event-stream 则视为错误
      if (!response.ok || !contentType || !contentType.includes('text/event-stream')) {
        throw new Error(`Unexpected response: status=${response.status} type=${contentType}`);
      }

      if (!response.body) throw new Error('No response body');
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk && !hasFirstChunk) setHasFirstChunk(true);
        finalAssistantMessage += chunk;
        
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          const updatedLastMessage = { ...lastMessage, content: finalAssistantMessage };
          return [...prev.slice(0, -1), updatedLastMessage];
        });
      }
      // 完成后保存历史
      const updated: Message[] = [...newMessages, { role: 'assistant', content: finalAssistantMessage }];
      setMessages(updated);
      saveHistoryWithRetry(updated);
    } catch (e: any) {
      console.error('AI chat error:', e);
      // 展示错误气泡
      const errMsg: Message = {
        role: 'assistant',
        content: '抱歉，网络出现问题，暂时无法回应。请稍后再试。',
      };
      const updated = [...messages, errMsg];
      setMessages(updated);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      const finalMessages = [...newMessages, { role: 'assistant', content: finalAssistantMessage }];
      // 写本地 + 后台重试保存
      saveHistoryWithRetry(finalMessages);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const currentInput = input;
    setInput('');
    await sendPrompt(currentInput);
  };

  const handleSuggestionClick = (s: string) => {
    sendPrompt(s);
  };

  const suggestions = buildSuggestions(word);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full md:w-[480px] lg:w-[520px] bg-background border-l border-border flex flex-col z-50 glass-surface-no-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-semibold text-foreground">AI问答小栈 — {word}</h2>
              <button onClick={onClose} className="p-2 text-muted hover:text-foreground transition-colors rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {/* 预设问题（仅新会话显示） */}
              {showSuggestions && (
                <div className="space-y-2">
                  <p className="text-sm text-muted">试试这些问题：</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-3 py-1 rounded-full bg-surface text-foreground text-xs hover:bg-surface/80 border border-border"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 text-sm ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  <div className={`p-3 rounded-lg max-w-sm prose prose-sm prose-invert break-words ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-surface text-foreground'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {/* 首字前的加载占位气泡 */}
              {isStreaming && !hasFirstChunk && (
                <div className="flex gap-3 text-sm">
                  <div className="p-3 rounded-lg max-w-sm bg-surface text-foreground">
                    <div className="flex items-center gap-1 h-4">
                      <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入你的问题... (Shift+Enter 换行)"
                  rows={1}
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} className="p-2 bg-primary rounded-lg text-primary-foreground disabled:opacity-50">
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-6 h-6 icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M931.392 11.264L45.12 530.688c-28.736 16.896-43.52 39.424-45.12 61.248v8.128c2.048 26.112 23.04 49.984 61.632 60.416l171.968 46.592a34.304 34.304 0 0 0 41.28-25.536 35.584 35.584 0 0 0-23.808-43.136L79.68 592l873.408-511.872-95.232 703.488c-1.408 10.432-9.152 15.68-18.752 12.992l-365.632-100.288 296.32-305.856a36.416 36.416 0 0 0 0-50.24 33.728 33.728 0 0 0-48.704 0l-324.8 335.36a110.72 110.72 0 0 0-7.872 9.088 35.52 35.52 0 0 0-16.128 30.784 104 104 0 0 0-5.248 32.64v206.4c0 49.664 53.568 79.168 93.568 51.712l166.272-114.368c10.24-6.976 16-19.136 15.232-31.872a35.712 35.712 0 0 0-19.2-29.504 33.28 33.28 0 0 0-34.24 2.304L435.84 937.856v-178.432l385.472 105.6c49.6 13.632 97.472-19.072 104.576-71.808l97.152-717.568c8.448-60.48-40-94.72-91.648-64.384z" fill="currentColor"></path></svg>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
