import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { getWordListsForUser, createWordListForUser } from '@/services/word-list.service';
import { WordListCreateSchema } from '@/lib/validators/word-list.schemas';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/me/word-lists
 * 
 * 获取当前用户的所有单词本
 * 
 * @description 从 public.word_lists 表中查询当前用户的所有单词本，包含单词数量
 * @returns 200 OK - 返回用户的单词本列表
 * @returns 401 Unauthorized - 用户未登录或token无效
 * @returns 500 Internal Server Error - 数据库查询失败
 */
export async function GET() {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 使用service函数获取用户的单词本列表
    const wordLists = await getWordListsForUser({
      supabase,
      userId: user.id,
    });

    // 3. 成功返回单词本列表
    return NextResponse.json({
      word_lists: wordLists
    }, { status: 200 });

  } catch (error) {
    // 统一错误处理
    return handleApiError(error);
  }
}

/**
 * POST /api/me/word-lists
 * 
 * 创建新的单词本
 * 
 * @description 在 public.word_lists 表中为当前用户创建新的单词本
 * @param request - 包含单词本名称的请求体
 * @returns 201 Created - 返回创建的单词本信息
 * @returns 400 Bad Request - 请求数据验证失败
 * @returns 401 Unauthorized - 用户未登录或token无效
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 解析并验证请求体
    const body = await request.json();
    const validatedData = WordListCreateSchema.parse(body);

    // 3. 使用service函数创建新单词本
    const newWordList = await createWordListForUser({
      supabase,
      userId: user.id,
      data: validatedData,
    });

    // 4. 成功返回创建的单词本
    return NextResponse.json({
      word_list: newWordList
    }, { status: 201 });

  } catch (error) {
    // 统一错误处理
    return handleApiError(error);
  }
}