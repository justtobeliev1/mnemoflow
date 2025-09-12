import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { NextRequest } from 'next/server'

// 服务端Supabase客户端工厂函数
export function createServerSupabaseClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
  })

  return client
}

// 从请求中提取token并创建客户端的辅助函数
export function createSupabaseFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('需要登录')
  }
  
  const token = authHeader.replace('Bearer ', '')
  return createServerSupabaseClient(token)
}
