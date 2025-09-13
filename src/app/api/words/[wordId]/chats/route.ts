import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { getChatHistoryForWord, sendMessageForWord } from '@/services/chat.service';
import { ChatHistoryQuerySchema, SendMessageSchema } from '@/lib/validators/chat.schemas';
import { handleApiError, createValidationError } from '@/lib/errors';

/**
 * GET /api/words/{wordId}/chats
 * 
 * 获取指定单词的聊天历史记录
 * 支持分页查询
 * 
 * @param request - 包含查询参数的请求
 * @param params - 路由参数，包含wordId
 * @returns 200 OK - 返回聊天历史列表
 * @returns 400 Bad Request - wordId参数或查询参数无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 500 Internal Server Error - 数据库查询失败
 */
export async function GET(
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

    // 3. 解析查询参数
    const { searchParams } = new URL(request.url);
    const queryParams = {
      limit: searchParams.get('limit') || undefined,
      before: searchParams.get('before') || undefined,
    };
    const validatedQuery = ChatHistoryQuerySchema.parse(queryParams);

    // 4. 获取聊天历史
    const chatHistory = await getChatHistoryForWord({
      supabase,
      userId: user.id,
      wordId,
      limit: validatedQuery.limit,
      before: validatedQuery.before,
    });

    // 5. 成功返回聊天历史
    return NextResponse.json({
      messages: chatHistory,
      total: chatHistory.length,
      word_id: wordId,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/words/{wordId}/chats
 * 
 * 向指定单词发送聊天消息并获取AI响应
 * 
 * @param request - 包含消息内容的请求体
 * @param params - 路由参数，包含wordId
 * @returns 201 Created - 返回用户消息和AI响应
 * @returns 400 Bad Request - 请求数据验证失败或wordId无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 单词不存在
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function POST(
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
    const validatedData = SendMessageSchema.parse(body);

    // 4. 发送消息并获取AI响应
    const { userMessage, aiMessage } = await sendMessageForWord({
      supabase,
      userId: user.id,
      wordId,
      data: validatedData,
    });

    // 5. 成功返回消息对话
    return NextResponse.json({
      message: '消息发送成功',
      conversation: {
        user_message: {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
          context: userMessage.context,
          created_at: userMessage.created_at,
        },
        ai_message: aiMessage ? {
          id: aiMessage.id,
          role: aiMessage.role,
          content: aiMessage.content,
          response_time: aiMessage.response_time,
          created_at: aiMessage.created_at,
        } : null,
      },
      word_id: wordId,
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}