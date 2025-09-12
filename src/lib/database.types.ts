// 基于 supabase_schema.md 的最新数据库类型定义

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          default_word_list_id: number | null
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          default_word_list_id?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          default_word_list_id?: number | null
          updated_at?: string
        }
      }
      words: {
        Row: {
          id: number
          word: string
          definition: any | null // JSONB
          phonetic: string | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: number
          word: string
          definition?: any | null
          phonetic?: string | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: number
          word?: string
          definition?: any | null
          phonetic?: string | null
          tags?: string[] | null
          created_at?: string
        }
      }
      word_mnemonics: {
        Row: {
          id: number
          word_id: number
          content: any // JSONB
          version: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          word_id: number
          content: any
          version?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          word_id?: number
          content?: any
          version?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      word_lists: {
        Row: {
          id: number
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      user_word_progress: {
        Row: {
          id: number
          user_id: string
          word_id: number
          word_list_id: number | null
          stability: number | null
          difficulty: number | null
          due: string
          lapses: number
          state: number
          last_review: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          word_id: number
          word_list_id?: number | null
          stability?: number | null
          difficulty?: number | null
          due?: string
          lapses?: number
          state?: number
          last_review?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          word_id?: number
          word_list_id?: number | null
          stability?: number | null
          difficulty?: number | null
          due?: string
          lapses?: number
          state?: number
          last_review?: string | null
          created_at?: string
        }
      }
      mnemonic_feedback: {
        Row: {
          id: number
          user_id: string
          word_mnemonic_id: number
          rating: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          word_mnemonic_id: number
          rating: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          word_mnemonic_id?: number
          rating?: number
          created_at?: string
        }
      }
      user_search_history: {
        Row: {
          id: number
          user_id: string
          word_id: number
          search_count: number
          last_searched_at: string
        }
        Insert: {
          id?: number
          user_id: string
          word_id: number
          search_count?: number
          last_searched_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          word_id?: number
          search_count?: number
          last_searched_at?: string
        }
      }
      word_chat_history: {
        Row: {
          id: number
          user_id: string
          word_id: number
          conversation_log: any | null // JSONB
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          word_id: number
          conversation_log?: any | null
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          word_id?: number
          conversation_log?: any | null
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 便捷类型导出
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Word = Database['public']['Tables']['words']['Row']
export type WordMnemonic = Database['public']['Tables']['word_mnemonics']['Row']
export type WordList = Database['public']['Tables']['word_lists']['Row']
export type UserWordProgress = Database['public']['Tables']['user_word_progress']['Row']
export type MnemonicFeedback = Database['public']['Tables']['mnemonic_feedback']['Row']
export type UserSearchHistory = Database['public']['Tables']['user_search_history']['Row']
export type WordChatHistory = Database['public']['Tables']['word_chat_history']['Row']