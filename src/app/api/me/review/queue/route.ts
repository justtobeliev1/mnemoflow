import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { getReviewQueueForUser, getReviewStatsForUser } from '@/services/review.service';
import { ReviewQueueQuerySchema } from '@/lib/validators/review.schemas';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/me/review/queue
 * 
 * 获取用户的复习队列
 * 支持limit和due_before查询参数
 * 
 * @param request - 包含查询参数的请求
 * @returns 200 OK - 返回复习队列和统计信息
 * @returns 400 Bad Request - 查询参数验证失败
 * @returns 401 Unauthorized - 用户未登录
 * @returns 500 Internal Server Error - 数据库查询失败
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const queryParams = {
      limit: searchParams.get('limit') || undefined,
      due_before: searchParams.get('due_before') || undefined,
    };

    // 3. 验证查询参数
    const validatedQuery = ReviewQueueQuerySchema.parse(queryParams);

    // 4. 并行获取复习队列和统计信息
    const [reviewQueue, reviewStats] = await Promise.all([
      getReviewQueueForUser({
        supabase,
        userId: user.id,
        limit: validatedQuery.limit,
        dueBefore: validatedQuery.due_before,
      }),
      getReviewStatsForUser({
        supabase,
        userId: user.id,
      }),
    ]);

    // 5. 成功返回复习队列和统计信息
    return NextResponse.json({
      queue: reviewQueue,
      stats: reviewStats,
      total: reviewQueue.length,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}