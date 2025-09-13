import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { updateWordProgressForUser } from '@/services/review.service';
import { ReviewProgressUpdateSchema } from '@/lib/validators/review.schemas';
import { handleApiError, createValidationError } from '@/lib/errors';

/**
 * PATCH /api/me/review/progress/{wordId}
 * 
 * 更新单词的学习进度（FSRS算法）
 * 根据用户的复习结果更新单词的稳定度、难度和下次复习时间
 * 
 * @param request - 包含复习结果的请求体
 * @param params - 路由参数，包含wordId
 * @returns 200 OK - 返回更新后的学习进度记录
 * @returns 400 Bad Request - 请求数据验证失败或wordId无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 学习记录不存在
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 验证和解析wordId参数
    const wordId = parseInt(params.wordId, 10);
    if (isNaN(wordId) || wordId <= 0) {
      throw createValidationError('无效的单词ID', 'wordId必须是正整数');
    }

    // 3. 解析并验证请求体
    const body = await request.json();
    const validatedData = ReviewProgressUpdateSchema.parse(body);

    // 4. 使用service函数更新学习进度
    const updatedProgress = await updateWordProgressForUser({
      supabase,
      userId: user.id,
      wordId,
      data: validatedData,
    });

    // 5. 成功返回更新后的学习进度
    return NextResponse.json({
      message: '学习进度更新成功',
      progress: updatedProgress,
      rating: validatedData.rating,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}