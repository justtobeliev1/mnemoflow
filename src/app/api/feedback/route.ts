import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { createFeedbackForUser } from '@/services/feedback.service';
import { CreateFeedbackSchema } from '@/lib/validators/feedback.schemas';
import { handleApiError } from '@/lib/errors';

/**
 * POST /api/feedback
 * 
 * 创建用户反馈
 * 用户可以提交bug报告、功能请求、改进建议等反馈
 * 
 * @param request - 包含反馈数据的请求体
 * @returns 201 Created - 返回创建的反馈记录
 * @returns 400 Bad Request - 请求数据验证失败
 * @returns 401 Unauthorized - 用户未登录
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 解析并验证请求体
    const body = await request.json();
    
    // 3. 自动添加用户代理信息
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer');
    
    const feedbackData = {
      ...body,
      user_agent: userAgent || undefined,
      url: referer || body.url || undefined,
    };
    
    const validatedData = CreateFeedbackSchema.parse(feedbackData);

    // 4. 使用service函数创建反馈
    const newFeedback = await createFeedbackForUser({
      supabase,
      userId: user.id,
      data: validatedData,
    });

    // 5. 成功返回创建的反馈记录
    return NextResponse.json({
      message: '反馈提交成功，感谢您的宝贵意见！',
      feedback: {
        id: newFeedback.id,
        type: newFeedback.type,
        title: newFeedback.title,
        priority: newFeedback.priority,
        status: newFeedback.status,
        created_at: newFeedback.created_at,
      }
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}