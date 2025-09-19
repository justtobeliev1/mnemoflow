import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError, createValidationError } from '@/lib/errors';

/**
 * GET /api/me/word-lists/{listId}/words
 * 轻量返回指定单词本中的单词集合，按 progress.created_at 旧→新 排序
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const { supabase, user } = await validateAuth();
    const listId = parseInt(params.listId, 10);
    if (isNaN(listId) || listId <= 0) {
      throw createValidationError('无效的单词本ID', 'listId 必须是正整数');
    }

    // 从 user_word_progress 关联 words 表取词条，按照 progress.created_at 升序
    const { data, error } = await supabase
      .from('user_word_progress')
      .select(`
        word_id,
        created_at,
        words:word_id (
          id,
          word,
          phonetic,
          definition,
          tags
        )
      `)
      .eq('user_id', user.id)
      .eq('word_list_id', listId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ message: '查询失败', error: error.message }, { status: 500 });
    }

    const words = (data || []).map((row: any) => ({
      id: row?.words?.id ?? row?.word_id,
      word: row?.words?.word ?? '',
      phonetic: row?.words?.phonetic ?? null,
      definition: row?.words?.definition ?? null,
      tags: row?.words?.tags ?? null,
      created_at: row?.created_at ?? null,
    }));

    return NextResponse.json({ words }, { status: 200 });
  } catch (e) {
    return handleApiError(e);
  }
}


