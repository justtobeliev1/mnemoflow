import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { Database } from './database.types';
import { createAuthError } from './errors';

/**
 * 为API Routes创建Supabase客户端的推荐方式
 * 使用新的Supabase SSR包，自动处理cookies和会话
 */
export function createSupabaseRouteClient() {
  const cookieStore = cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // 在某些情况下设置cookie可能失败，这是正常的
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // 在某些情况下删除cookie可能失败，这是正常的
          }
        },
      },
    }
  );
}

/**
 * 获取当前认证用户
 * 如果用户未登录，抛出认证错误
 */
export async function getAuthenticatedUser(supabase: ReturnType<typeof createSupabaseRouteClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw createAuthError('用户认证失败');
  }
  
  return user;
}

/**
 * 验证用户认证状态的辅助函数
 * 返回supabase客户端和用户信息
 */
export async function validateAuth() {
  const supabase = createSupabaseRouteClient();
  const user = await getAuthenticatedUser(supabase);
  
  return { supabase, user };
}

// ===== 以下为兼容性保留，逐步迁移到上面的推荐方式 =====

/**
 * @deprecated 使用 createSupabaseRouteClient() 替代
 * 服务端Supabase客户端工厂函数（基于token）
 */
export function createServerSupabaseClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const client = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });

  return client;
}

/**
 * @deprecated 使用 validateAuth() 替代
 * 从请求中提取token并创建客户端的辅助函数
 */
export function createSupabaseFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw createAuthError('需要登录');
  }
  
  const token = authHeader.replace('Bearer ', '');
  return createServerSupabaseClient(token);
}