import { createClient } from '@supabase/supabase-js'

// 环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 数据库类型定义
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          display_name: string | null
          avatar_url: string | null
          preferences: any | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: any | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: any | null
        }
      }
      words: {
        Row: {
          id: string
          word: string
          phonetic: string | null
          definition: string
          translation: string | null
          pos: string | null
          collins: number | null
          oxford: number | null
          tag: string | null
          bnc: number | null
          frq: number | null
          exchange: string | null
          detail: string | null
          audio: string | null
        }
        Insert: {
          id?: string
          word: string
          phonetic?: string | null
          definition: string
          translation?: string | null
          pos?: string | null
          collins?: number | null
          oxford?: number | null
          tag?: string | null
          bnc?: number | null
          frq?: number | null
          exchange?: string | null
          detail?: string | null
          audio?: string | null
        }
        Update: {
          id?: string
          word?: string
          phonetic?: string | null
          definition?: string
          translation?: string | null
          pos?: string | null
          collins?: number | null
          oxford?: number | null
          tag?: string | null
          bnc?: number | null
          frq?: number | null
          exchange?: string | null
          detail?: string | null
          audio?: string | null
        }
      }
      word_mnemonics: {
        Row: {
          id: string
          word_id: string
          user_id: string
          content: string
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          word_id: string
          user_id: string
          content: string
          type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          word_id?: string
          user_id?: string
          content?: string
          type?: string
          created_at?: string
          updated_at?: string
        }
      }
      word_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_word_progress: {
        Row: {
          id: string
          user_id: string
          word_id: string
          word_list_id: string
          state: string
          stability: number
          difficulty: number
          elapsed_days: number
          scheduled_days: number
          reps: number
          lapses: number
          last_review: string | null
          due: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id: string
          word_list_id: string
          state?: string
          stability?: number
          difficulty?: number
          elapsed_days?: number
          scheduled_days?: number
          reps?: number
          lapses?: number
          last_review?: string | null
          due?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string
          word_list_id?: string
          state?: string
          stability?: number
          difficulty?: number
          elapsed_days?: number
          scheduled_days?: number
          reps?: number
          lapses?: number
          last_review?: string | null
          due?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_search_history: {
        Row: {
          id: string
          user_id: string
          query: string
          results_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          results_count: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          results_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
