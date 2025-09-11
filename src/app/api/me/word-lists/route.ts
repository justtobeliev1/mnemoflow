import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 获取用户的单词本列表
export async function GET(request: NextRequest) {
  try {
    // 从请求头获取授权信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      )
    }

    // 创建服务端Supabase客户端
    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('认证错误:', authError)
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    // 查询用户的单词本
    const { data: wordLists, error } = await supabase
      .from('word_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

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

    if (error) {
      console.error('获取单词本时出错:', error)
      return NextResponse.json(
        { error: '获取单词本失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      wordLists: enrichedWordLists
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 创建新的单词本
export async function POST(request: NextRequest) {
  try {
    // 从请求头获取授权信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      )
    }

    // 创建服务端Supabase客户端
    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('认证错误:', authError)
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: '单词本名称不能为空' },
        { status: 400 }
      )
    }

    // 创建新单词本
    const { data: newWordList, error } = await supabase
      .from('word_lists')
      .insert({
        user_id: user.id,
        name: name.trim(),
        is_default: false
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
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
