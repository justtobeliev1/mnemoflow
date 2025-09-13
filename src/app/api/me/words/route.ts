import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { collectWordForUser } from '@/services/word.service';
import { WordCollectSchema } from '@/lib/validators/word.schemas';
import { handleApiError } from '@/lib/errors';

/**
 * POST /api/me/words
 * 
 * 收录单词到用户的学习列表
 * 
 * @param request - 包含单词收录数据的请求体
 * @returns 201 Created - 返回创建的学习进度记录
 * @returns 400 Bad Request - 请求数据验证失败或单词已收录
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 单词或单词本不存在
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 解析并验证请求体
    const body = await request.json();
    const validatedData = WordCollectSchema.parse(body);

    // 3. 使用service函数收录单词
    const newProgress = await collectWordForUser({
      supabase,
      userId: user.id,
      data: validatedData,
    });

    // 4. 成功返回创建的学习进度记录
    return NextResponse.json({
      message: '单词收录成功',
      progress: newProgress
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}