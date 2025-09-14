import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';

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
export async function GET() {
  try {
    return NextResponse.json({
      message: 'This endpoint has been deprecated. Use POST /api/ai/chat and GET/POST /api/me/chat-history instead.',
      deprecated: true,
    }, { status: 410 });
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
export async function POST() {
  try {
    return NextResponse.json({
      message: 'This endpoint has been deprecated. Use POST /api/ai/chat instead.',
      deprecated: true,
    }, { status: 410 });
  } catch (error) {
    return handleApiError(error);
  }
}