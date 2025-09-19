import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError, createValidationError } from '@/lib/errors';

/**
 * GET /api/me/quiz/options/{wordId}
 * 为给定单词生成4个选项（1 正确 + 3 干扰），统一使用数据库函数 get_quiz_options。
 * 返回：{ options: string[], correct: string, raw: any[] }
 */
export async function GET(_req: NextRequest, { params }: { params: { wordId: string } }) {
  try {
    const { supabase } = await validateAuth();
    const wordId = parseInt(params.wordId, 10);
    if (Number.isNaN(wordId) || wordId <= 0) {
      throw createValidationError('无效的 wordId', 'wordId 必须为正整数');
    }

    const { data, error } = await (supabase as any).rpc('get_quiz_options', { p_word_id: wordId });
    if (error) {
      return NextResponse.json({ message: '生成选项失败', error: error.message }, { status: 500 });
    }

    const rows: any[] = Array.isArray(data) ? data : [];
    // 优先使用 compressed_definition 作为展示文本；兜底使用 word
    const options = rows.map(r => r.compressed_definition || r.word || '');
    const correctRow = rows.find(r => r.is_correct) || null;
    const correct = correctRow ? (correctRow.compressed_definition || correctRow.word || '') : '';

    return NextResponse.json({ options, correct, raw: rows }, { status: 200 });
  } catch (e) {
    return handleApiError(e);
  }
}


