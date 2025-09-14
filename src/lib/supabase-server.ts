import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { Database } from './database.types';
import { createAuthError } from './errors';

/**
 * a a fetch a a a a AbortControllera a a a a
 * @param resource fetch a URL
 * @param options fetch a a a a timeout a a (a a)
 * @returns Promise<Response>
 */
async function fetchWithTimeout(
  resource: RequestInfo | URL,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 25000 } = options; // a a 25 a

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    // a a a a fetch a AbortErrora a a a
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout} ms`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

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
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      fetch: fetchWithTimeout,
    },
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

/**
 * auth.getUser() 带指数退避重试，缓解网络抖动导致的 UND_ERR_CONNECT_TIMEOUT
 */
export async function getUserWithRetry(
  supabase: ReturnType<typeof createServerSupabaseClient> | ReturnType<typeof createSupabaseRouteClient>,
  maxAttempts = 3,
): Promise<NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']>> {
  let lastError: any;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) return user;
      throw new Error('No user');
    } catch (err) {
      lastError = err;
      const delay = 200 * Math.pow(2, attempt); // 200, 400, 800ms
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}