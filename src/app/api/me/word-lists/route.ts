import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 获取用户的单词本列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: '需要登录' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) return NextResponse.json({ error: '用户认证失败' }, { status: 401 })

    // 获取用户的 default_word_list_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_word_list_id')
      .eq('id', user.id)
      .single();

    const defaultId = profile?.default_word_list_id || null;

    const { data: wordLists, error } = await supabase
      .from('word_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: '获取单词本失败' }, { status: 500 })

    // 添加 isDefault 标志
    const enrichedWordLists = wordLists.map(list => ({
      ...list,
      isDefault: list.id === defaultId
    }));

    return NextResponse.json({ wordLists: enrichedWordLists });
  } catch (error) {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 创建新的单词本
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: '需要登录' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) return NextResponse.json({ error: '用户认证失败' }, { status: 401 })

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) return NextResponse.json({ error: '单词本名称不能为空' }, { status: 400 })

    const normalizedName = name.trim();

    // 同名检测（同一用户下名称唯一）
    const { data: existed } = await supabase
      .from('word_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', normalizedName)
      .maybeSingle();

    if (existed) {
      return NextResponse.json({ error: '已存在同名单词本' }, { status: 409 });
    }

    const { data: newWordList, error } = await supabase
      .from('word_lists')
      .insert({
        user_id: user.id,
        name: normalizedName
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: '创建单词本失败' }, { status: 500 })

    return NextResponse.json({ wordList: newWordList })
  } catch (error) {
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
