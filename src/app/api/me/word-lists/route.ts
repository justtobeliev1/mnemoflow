import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // 设置Supabase客户端的访问令牌
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

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
      console.log('POST: 缺少授权头')
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      )
    }

    // 设置Supabase客户端的访问令牌
    const token = authHeader.replace('Bearer ', '')
    console.log('POST: 使用token创建客户端，token长度:', token.length)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('POST: 认证错误:', authError)
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    console.log('POST: 认证成功，用户ID:', user.id)

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: '单词本名称不能为空' },
        { status: 400 }
      )
    }

    console.log('POST: 准备创建单词本，名称:', name.trim())

    // 检查是否已存在相同名称的单词本
    const { data: existingLists, error: checkError } = await supabase
      .from('word_lists')
      .select('name')
      .eq('user_id', user.id)
      .ilike('name', name.trim())

    if (checkError) {
      console.error('POST: 检查重名时出错:', checkError)
    } else if (existingLists && existingLists.length > 0) {
      console.log('POST: 发现重名单词本')
      return NextResponse.json(
        { error: '单词本名称已存在，请使用其他名称' },
        { status: 409 }
      )
    }

    // 创建新单词本
    const { data: newWordList, error } = await supabase
      .from('word_lists')
      .insert({
        user_id: user.id,
        name: name.trim()
        // description 字段不存在于表中，移除它
        // description: description?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('POST: 创建单词本时出错:', error)
      console.error('POST: 错误详情:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: '创建单词本失败: ' + error.message },
        { status: 500 }
      )
    }

    console.log('POST: 单词本创建成功:', newWordList)

    return NextResponse.json({
      wordList: newWordList
    }, { status: 201 })

  } catch (error) {
    console.error('POST: API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
