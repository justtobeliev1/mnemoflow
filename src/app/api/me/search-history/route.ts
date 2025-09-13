import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { getSearchHistoryForUser } from '@/services/word.service';
import { SearchHistoryQuerySchema } from '@/lib/validators/word.schemas';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/me/search-history
 * 
 * 获取用户的搜索历史记录
 * 支持limit查询参数来限制返回结果数量
 * 
 * @param request - 包含查询参数的请求
 * @returns 200 OK - 返回搜索历史列表
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
    };

    // 3. 验证查询参数
    const validatedQuery = SearchHistoryQuerySchema.parse(queryParams);

    // 4. 使用service函数获取搜索历史
    const searchHistory = await getSearchHistoryForUser({
      supabase,
      userId: user.id,
      limit: validatedQuery.limit,
    });

    // 5. 成功返回搜索历史列表
    return NextResponse.json({
      search_history: searchHistory,
      total: searchHistory.length,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}