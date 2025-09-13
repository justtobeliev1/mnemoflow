import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { 
  getWordListById, 
  getWordsInList, 
  updateWordListForUser, 
  deleteWordListForUser 
} from '@/services/word-list.service';
import { WordListUpdateSchema } from '@/lib/validators/word-list.schemas';
import { handleApiError, createValidationError } from '@/lib/errors';

/**
 * GET /api/me/word-lists/{listId}
 * 
 * 获取指定单词本的详细信息，包含其中的所有单词
 * 
 * @param params - 路由参数，包含listId
 * @returns 200 OK - 返回单词本详情和单词列表
 * @returns 400 Bad Request - listId参数无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 单词本不存在或不属于当前用户
 * @returns 500 Internal Server Error - 数据库查询失败
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 验证和解析listId参数
    const listId = parseInt(params.listId, 10);
    if (isNaN(listId) || listId <= 0) {
      throw createValidationError('无效的单词本ID', 'listId必须是正整数');
    }

    // 3. 获取单词本基本信息
    const wordList = await getWordListById({
      supabase,
      userId: user.id,
      listId,
    });

    // 4. 获取单词本中的所有单词
    const words = await getWordsInList({
      supabase,
      userId: user.id,
      listId,
    });

    // 5. 成功返回单词本详情
    return NextResponse.json({
      word_list: wordList,
      words: words,
      total_words: words.length,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/me/word-lists/{listId}
 * 
 * 更新指定单词本的信息（如名称）
 * 
 * @param request - 包含更新数据的请求体
 * @param params - 路由参数，包含listId
 * @returns 200 OK - 返回更新后的单词本信息
 * @returns 400 Bad Request - 请求数据验证失败或listId无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 单词本不存在或不属于当前用户
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 验证和解析listId参数
    const listId = parseInt(params.listId, 10);
    if (isNaN(listId) || listId <= 0) {
      throw createValidationError('无效的单词本ID', 'listId必须是正整数');
    }

    // 3. 解析并验证请求体
    const body = await request.json();
    const validatedData = WordListUpdateSchema.parse(body);

    // 4. 使用service函数更新单词本
    const updatedWordList = await updateWordListForUser({
      supabase,
      userId: user.id,
      listId,
      data: validatedData,
    });

    // 5. 成功返回更新后的单词本
    return NextResponse.json({
      word_list: updatedWordList
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/me/word-lists/{listId}
 * 
 * 删除指定的单词本
 * 注意：这会同时删除该单词本中的所有学习进度记录
 * 
 * @param params - 路由参数，包含listId
 * @returns 200 OK - 删除成功
 * @returns 400 Bad Request - listId参数无效或不能删除默认单词本
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 单词本不存在或不属于当前用户
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 验证和解析listId参数
    const listId = parseInt(params.listId, 10);
    if (isNaN(listId) || listId <= 0) {
      throw createValidationError('无效的单词本ID', 'listId必须是正整数');
    }

    // 3. 使用service函数删除单词本
    const result = await deleteWordListForUser({
      supabase,
      userId: user.id,
      listId,
    });

    // 4. 成功返回删除结果
    return NextResponse.json({
      message: '单词本删除成功',
      success: result.success
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}