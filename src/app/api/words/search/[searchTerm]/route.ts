import { NextRequest, NextResponse } from 'next/server';
import { validateAuth, createServerSupabaseClient } from '@/lib/supabase-server';
import { findWordByText, recordSearchHistory } from '@/services/word.service';
import { handleApiError, createValidationError, createAuthError } from '@/lib/errors';

/**
 * GET /api/words/search/{searchTerm}
 * 
 * 根据搜索词查询单词信息
 * 支持异步加载机制，会自动记录用户搜索历史
 * 
 * @param params - 路由参数，包含searchTerm
 * @returns 200 OK - 返回单词信息
 * @returns 400 Bad Request - searchTerm参数无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 单词不存在
 * @returns 500 Internal Server Error - 数据库查询失败
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { searchTerm: string } }
) {
  try {
    // 1. 验证用户认证状态 - 优先使用Authorization header，回退到cookies
    let supabase;
    let user;
    
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // 使用Authorization header中的token
      try {
        const token = authHeader.replace('Bearer ', '');
        supabase = createServerSupabaseClient(token);
        const { data: { user: tokenUser }, error } = await supabase.auth.getUser();
        if (error || !tokenUser) {
          console.error('Token认证错误:', error);
          throw createAuthError('Authorization token无效');
        }
        user = tokenUser;
      } catch (tokenError) {
        console.error('Token认证失败，尝试cookie认证:', tokenError);
        // 如果token认证失败，尝试cookie认证
        const authResult = await validateAuth();
        supabase = authResult.supabase;
        user = authResult.user;
      }
    } else {
      // 使用cookies认证
      const authResult = await validateAuth();
      supabase = authResult.supabase;
      user = authResult.user;
    }

    // 2. 验证和解码searchTerm参数
    const searchTerm = decodeURIComponent(params.searchTerm).trim();
    if (!searchTerm || searchTerm.length === 0) {
      throw createValidationError('搜索词不能为空', 'searchTerm必须是有效的字符串');
    }

    if (searchTerm.length > 100) {
      throw createValidationError('搜索词过长', 'searchTerm不能超过100个字符');
    }

    // 3. 使用service函数查询单词
    const word = await findWordByText({
      supabase,
      searchTerm,
    });

    // 4. 如果单词不存在，返回404
    if (!word) {
      return NextResponse.json({
        error: '单词不存在',
        message: `未找到单词: ${searchTerm}`,
        search_term: searchTerm,
      }, { status: 404 });
    }

    // 5. 异步记录搜索历史（不阻塞响应）
    // 使用Promise.resolve().then()来确保在当前事件循环后执行
    Promise.resolve().then(async () => {
      try {
        await recordSearchHistory({
          supabase,
          userId: user.id,
          wordId: word.id,
        });
      } catch (historyError) {
        // 搜索历史记录失败不影响主要功能，只记录错误
        console.error('记录搜索历史失败:', historyError);
      }
    });

    // 6. 成功返回单词信息
    return NextResponse.json({
      word: {
        id: word.id,
        word: word.word,
        definition: word.definition,
        phonetic: word.phonetic,
        tags: word.tags,
        created_at: word.created_at,
      },
      search_term: searchTerm,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}