import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase-server';

/**
 * GET /api/me/quiz/options/{wordId}
 * 为给定单词生成4个选项（1 正确 + 3 干扰），统一使用数据库函数 get_quiz_options。
 * 返回：{ options: string[], correct: string, raw: any[] }
 */
export async function GET(_req: NextRequest, { params }: { params: { wordId: string } }) {
  try {
    const supabase = createSupabaseRouteClient();
    const wordId = parseInt(params.wordId, 10);
    if (Number.isNaN(wordId) || wordId <= 0) {
      return NextResponse.json({ error: { statusCode: 400, message: '无效的 wordId', details: 'wordId 必须为正整数' } }, { status: 400 });
    }

    const { data, error } = await (supabase as any).rpc('get_quiz_options', { p_word_id: wordId });
    if (error) {
      return NextResponse.json({ error: { statusCode: 500, message: '生成选项失败', details: error.message } }, { status: 500 });
    }

    const rows: any[] = Array.isArray(data) ? data : [];
    const options = rows.map(r => r.compressed_definition || r.word || '');
    const correctRow = rows.find(r => r.is_correct) || null;
    const correct = correctRow ? (correctRow.compressed_definition || correctRow.word || '') : '';

    return NextResponse.json({ options, correct, raw: rows }, { status: 200 });
  } catch (e: any) {
    console.error('quiz/options error', e);
    return NextResponse.json({ error: { statusCode: 500, message: '服务器内部错误', details: e?.message || 'unknown' } }, { status: 500 });
  }
}


