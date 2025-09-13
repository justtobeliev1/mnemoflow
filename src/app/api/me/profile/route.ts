import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { getProfileForUser, updateProfileForUser } from '@/services/profile.service';
import { ProfileUpdateSchema } from '@/lib/validators/profile.schemas';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/me/profile
 * 
 * 获取当前登录用户的个人资料
 * 
 * @description 从 public.profiles 表中查询与当前登录用户 id 匹配的记录
 * @returns 200 OK - 返回用户的个人资料信息
 * @returns 401 Unauthorized - 用户未登录或token无效
 * @returns 404 Not Found - 用户资料不存在
 * @returns 500 Internal Server Error - 数据库查询失败
 */
export async function GET() {
  try {
    // 1. 验证用户认证状态并获取supabase客户端
    const { supabase, user } = await validateAuth();

    // 2. 使用service函数获取用户资料
    const profile = await getProfileForUser({
      supabase,
      userId: user.id,
    });

    // 3. 成功返回用户资料
    return NextResponse.json({
      profile
    }, { status: 200 });

  } catch (error) {
    // 统一错误处理
    return handleApiError(error);
  }
}

/**
 * PATCH /api/me/profile
 * 
 * 更新当前登录用户的个人资料
 * 
 * @description 更新 public.profiles 表中当前用户的资料信息
 * @param request - 包含更新数据的请求体
 * @returns 200 OK - 返回更新后的用户资料信息
 * @returns 400 Bad Request - 请求数据验证失败
 * @returns 401 Unauthorized - 用户未登录或token无效
 * @returns 404 Not Found - 用户资料不存在
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 解析并验证请求体
    const body = await request.json();
    const validatedData = ProfileUpdateSchema.parse(body);

    // 3. 使用service函数更新用户资料
    const updatedProfile = await updateProfileForUser({
      supabase,
      userId: user.id,
      data: validatedData,
    });

    // 4. 成功返回更新后的用户资料
    return NextResponse.json({
      profile: updatedProfile
    }, { status: 200 });

  } catch (error) {
    // 统一错误处理
    return handleApiError(error);
  }
}