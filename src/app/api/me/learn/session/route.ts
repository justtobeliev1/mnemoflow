import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError, createValidationError } from '@/lib/errors';

/**
 * GET /api/me/learn/session?listId=xx&limit=20
 *
 * 学习模式“备餐员”：一次性为指定单词本准备 N 道题。
 * 复用数据库层 RPC：public.generate_learn_session(user_id, list_id, limit)
 * 返回结构与 review/session 相同：{ quizzes: [{ quiz_word_id, options:[{word_id, word, definition}] }] }
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await validateAuth(request);

    const { searchParams } = new URL(request.url);
    const rawListId = searchParams.get('listId');
    const rawLimit = searchParams.get('limit');

    if (!rawListId) {
      throw createValidationError('缺少参数', '需要提供 listId');
    }
    const listId = parseInt(rawListId, 10);
    if (Number.isNaN(listId) || listId <= 0) {
      throw createValidationError('无效的 listId', 'listId 必须是正整数');
    }

    let limit = 20;
    if (rawLimit !== null) {
      const parsed = parseInt(rawLimit, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        throw createValidationError('无效的 limit 参数', 'limit 必须是 1-100 的整数');
      }
      limit = parsed;
    }

    const { data, error } = await (supabase as any).rpc('generate_learn_session', {
      p_user_id: user.id,
      p_word_list_id: listId,
      p_limit: limit,
    });

    if (error) {
      return NextResponse.json({ error: { statusCode: 500, message: '生成学习会话失败', details: error.message } }, { status: 500 });
    }

    const payload = data ?? { quizzes: [] };
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}


