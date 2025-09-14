import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { removeWordForUser, moveWordForUser, getProgressForWord } from '@/services/word.service';
import { WordMoveSchema } from '@/lib/validators/word.schemas';
import { handleApiError, createValidationError } from '@/lib/errors';

/**
 * DELETE /api/me/words/{wordId}
 * 
 * 从用户学习列表中移除单词
 * 
 * @param params - 路由参数，包含wordId
 * @returns 200 OK - 删除成功
 * @returns 400 Bad Request - wordId参数无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 单词记录不存在
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function DELETE(
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

    // 3. 使用service函数移除单词
    const result = await removeWordForUser({
      supabase,
      userId: user.id,
      wordId,
    });

    // 4. 成功返回删除结果
    return NextResponse.json({
      message: '单词移除成功',
      success: result.success
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/me/words/{wordId}
 * 
 * 查询当前单词的学习进度（用于判断是否已收藏及归属的单词本）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    const { supabase, user } = await validateAuth();
    const wordId = parseInt(params.wordId, 10);
    if (isNaN(wordId) || wordId <= 0) {
      throw createValidationError('无效的单词ID', 'wordId必须是正整数');
    }

    const progress = await getProgressForWord({ supabase, userId: user.id, wordId });
    return NextResponse.json(progress || {});
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/me/words/{wordId}
 * 
 * 移动单词到其他单词本
 * 
 * @param request - 包含移动数据的请求体
 * @param params - 路由参数，包含wordId
 * @returns 200 OK - 返回更新后的学习进度记录
 * @returns 400 Bad Request - 请求数据验证失败或wordId无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 单词记录或目标单词本不存在
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
    const validatedData = WordMoveSchema.parse(body);

    // 4. 使用service函数移动单词
    const updatedProgress = await moveWordForUser({
      supabase,
      userId: user.id,
      wordId,
      data: validatedData,
    });

    // 5. 成功返回更新后的学习进度记录
    return NextResponse.json({
      message: '单词移动成功',
      progress: updatedProgress
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}