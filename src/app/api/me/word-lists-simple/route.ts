import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseFromRequest } from '@/lib/supabase-server'

// 获取用户的单词本列表 (使用RLS简化版)
export async function GET(request: NextRequest) {
  try {
    // 使用RLS，不需要手动验证用户
    const supabase = createSupabaseFromRequest(request)
    
    // RLS会自动过滤出当前用户的数据
    const { data: wordLists, error } = await supabase
      .from('word_lists')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取单词本时出错:', error)
      return NextResponse.json(
        { error: '获取单词本失败' },
        { status: 500 }
      )
    }

    // 为每个单词本查询单词数量
    let enrichedWordLists = []
    if (wordLists && wordLists.length > 0) {
      for (const list of wordLists) {
        const { count } = await supabase
          .from('user_word_progress')
          .select('*', { count: 'exact', head: true })
          .eq('word_list_id', list.id)
        
        enrichedWordLists.push({
          ...list,
          wordCount: count || 0
        })
      }
    }

    return NextResponse.json({
      wordLists: enrichedWordLists
    })

  } catch (error) {
    if (error instanceof Error && error.message === '需要登录') {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      )
    }
    
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 创建新的单词本 (使用RLS简化版)
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseFromRequest(request)
    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: '单词本名称不能为空' },
        { status: 400 }
      )
    }

    // 获取当前用户ID
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    // 创建单词本，需要明确设置user_id
    const { data: newWordList, error } = await supabase
      .from('word_lists')
      .insert({
        name: name.trim(),
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('创建单词本时出错:', error)
      return NextResponse.json(
        { error: '创建单词本失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      wordList: newWordList
    }, { status: 201 })

  } catch (error) {
    if (error instanceof Error && error.message === '需要登录') {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      )
    }
    
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}