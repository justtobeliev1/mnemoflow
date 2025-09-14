import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

// 环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建Supabase客户端
// 使用 @supabase/ssr 的浏览器端客户端以自动同步 Auth cookies 到服务端
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// 导出类型以便其他文件使用
export type { Database } from './database.types'