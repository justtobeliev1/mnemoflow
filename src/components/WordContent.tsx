'use client';

import { PronunciationButton } from './PronunciationButton';
import { parsePhonetic, formatPhonetic } from '@/utils/phonetic';
import { parseDefinition } from '@/utils/definition';
import { parseTags, getTagColorClass } from '@/utils/tags';
import { ActionBar } from './ActionBar';

interface WordData {
  id: number;
  word: string;
  phonetic: string | null;
  definition: any;
  tags: string[] | null;
  created_at: string;
}

interface WordContentProps {
  word: WordData;
  onAIChatClick: () => void;
}

export function WordContent({ word, onAIChatClick }: WordContentProps) {
  const phonetic = parsePhonetic(word.phonetic);
  const definitions = parseDefinition(word.definition);
  const tags = parseTags(word.tags);
  
  return (
    <div className="glass-surface-no-border rounded-xl p-8 space-y-8 max-w-3xl mx-auto">
      {/* 单词标题和发音 - 居左对齐 */}
      <div className="space-y-4">
        <h1 className="text-5xl font-bold text-foreground">{word.word}</h1>
        
        <div className="flex flex-wrap items-center gap-6">
          {phonetic.uk && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">英</span>
              <span className="text-lg text-foreground">
                {formatPhonetic(phonetic.uk)}
              </span>
              <PronunciationButton word={word.word} accent="UK" />
            </div>
          )}
          
          {phonetic.us && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">美</span>
              <span className="text-lg text-foreground">
                {formatPhonetic(phonetic.us)}
              </span>
              <PronunciationButton word={word.word} accent="US" />
            </div>
          )}
          
          {/* 如果没有音标，至少提供一个发音按钮 */}
          {!phonetic.uk && !phonetic.us && (
            <PronunciationButton word={word.word} accent="US" />
          )}
        </div>
      </div>
      
      {/* 释义部分 - 使用留白分隔 */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-foreground">释义</h2>
          <div className="flex items-center gap-4 -mt-[120px]">
            <ActionBar word={word} onAIChatClick={onAIChatClick} />
          </div>
        </div>
        
        <div className="space-y-3">
          {definitions.length > 0 ? (
            definitions.map((def, index) => (
              <div key={index} className="flex items-start gap-3">
                {def.pos && (
                  <span className="text-sm text-muted bg-surface/50 px-2 py-1 rounded-md shrink-0">
                    {def.pos}
                  </span>
                )}
                <span className="text-foreground leading-relaxed">{def.meaning}</span>
              </div>
            ))
          ) : (
            <div className="text-muted">
              暂无释义信息
            </div>
          )}
        </div>
      </div>
      
      {/* 标签部分 - 使用灰蓝色文字，统一样式 */}
      {tags.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {/* 标签图标 */}
            <svg className="w-5 h-5 text-muted" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M570.289 154.296L915.98 499.987c58.583 58.584 58.56 153.588-0.05 212.2L737.842 890.274c-11.723 11.722-30.724 11.726-42.44 0.01-11.717-11.717-11.712-30.718 0.01-42.44L873.5 669.757c35.167-35.167 35.18-92.17 0.03-127.32L527.84 196.746c-11.717-11.717-11.712-30.718 0.01-42.44 11.722-11.722 30.723-11.727 42.44-0.01zM154.613 124.98h1.495l0.417 0.001h0.955l0.537 0.001h1.192l193.277 0.12a89.986 89.986 0 0 1 63.576 26.354l390.57 390.569c35.15 35.15 35.136 92.153-0.03 127.32l-198.1 198.099c-35.167 35.166-92.17 35.18-127.32 0.03L90.615 476.903a89.986 89.986 0 0 1-26.354-63.575l-0.123-198.223c-0.03-49.72 40.252-90.072 89.973-90.126h0.503z m-0.415 60.019c-16.625 0.018-30.052 13.468-30.042 30.042l0.123 198.222a29.995 29.995 0 0 0 8.784 21.192l390.57 390.569c11.716 11.717 30.717 11.712 42.44-0.01l198.099-198.1c11.722-11.722 11.726-30.722 0.01-42.44l-390.57-390.568a29.995 29.995 0 0 0-21.192-8.785l-198.222-0.122z m216.528 104.845c39.056 39.056 39.04 102.392-0.033 141.466-39.074 39.074-102.41 39.09-141.466 0.034-39.056-39.056-39.04-102.392 0.033-141.466 39.074-39.074 102.41-39.09 141.466-0.034z m-99.036 42.463c-15.63 15.63-15.636 40.965-0.013 56.587 15.622 15.622 40.956 15.616 56.586-0.014 15.63-15.63 15.636-40.964 0.013-56.586-15.622-15.622-40.956-15.616-56.586 0.013z"/>
            </svg>
            <h3 className="text-lg font-medium text-muted">标签</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="text-sm text-slate-400 bg-slate-500/20 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}