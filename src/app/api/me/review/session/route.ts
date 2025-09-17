import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, createSupabaseRouteClient } from '@/lib/supabase-server';
import { handleApiError, createValidationError } from '@/lib/errors';

/**
 * GET /api/me/review/session
 *
 * 一次性返回整场复习会话的数据（由数据库层 RPC 生成）
 * - 验证用户
 * - 解析可选 query `limit`（默认 20，上限 100）
 * - 调用 public.generate_review_session(user_id, limit)
 * - 直接透传其 JSON 结果
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await validateAuth(request);

    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get('limit');
    let limit = 20;
    if (rawLimit !== null) {
      const parsed = parseInt(rawLimit, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        throw createValidationError('无效的 limit 参数', 'limit 必须是 1-100 的整数');
      }
      limit = parsed;
    }

    // 调用数据库 RPC：generate_review_session
    const { data, error } = await (supabase as any).rpc('generate_review_session', {
      p_user_id: user.id,
      p_limit: limit,
    });

    if (error) {
      return NextResponse.json({ error: { statusCode: 500, message: '生成复习会话失败', details: error.message } }, { status: 500 });
    }

    // RPC 直接返回 JSON；若为空则给出空结构
    const payload = data ?? { quizzes: [] };
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}


