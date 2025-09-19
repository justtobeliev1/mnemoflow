"use client";

import { useMemo } from 'react';
import { useMnemonic } from '@/hooks/useMnemonic';

/**
 * 提取助记JSON中的“助记蓝图”文本，供 ChoiceTestPanel 首错提示使用。
 */
export function usePromptBlueprint(wordId?: number) {
  const { data, isLoading, error } = useMnemonic(wordId, { timeoutMs: 30000 });

  const blueprint = useMemo(() => {
    if (!data) return '';
    // 兼容不同字段命名：blueprint.content | blueprint | scene | meaning
    if (typeof data === 'object') {
      // @ts-ignore
      const c = data?.blueprint?.content || data?.blueprint || '';
      return typeof c === 'string' ? c : '';
    }
    return '';
  }, [data]);

  return { blueprint, isLoading, error };
}
