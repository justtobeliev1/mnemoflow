import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 初始化用户档案和默认数据
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

    // 检查用户是否已有档案
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, default_word_list_id')
      .eq('id', user.id)
      .single()

    // 如果没有档案，创建用户档案
    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || ''
        })

      if (profileError) {
        console.error('创建用户档案失败:', profileError)
        // 档案创建失败不是致命错误，继续处理
      }
    }

    // 如果 profiles 已经有默认单词本引用且存在，则结束
    if (existingProfile?.default_word_list_id) {
      const { data: wlById } = await supabase
        .from('word_lists')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', existingProfile.default_word_list_id)
        .single();
      if (wlById) {
        return NextResponse.json({ success: true, message: '用户数据初始化完成' });
      }
    }

    // 若 profiles 未设置或引用已失效：先查是否已有名为“默认单词本”的列表
    const { data: wlByName } = await supabase
      .from('word_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', '默认单词本')
      .maybeSingle();

    let defaultListId = wlByName?.id as string | null;

    // 若不存在则创建
    if (!defaultListId) {
      const { data: newWordList, error: wordListError } = await supabase
        .from('word_lists')
        .insert({ user_id: user.id, name: '默认单词本' })
        .select('id')
        .single();
      if (wordListError) {
        console.error('创建默认单词本失败:', wordListError);
        return NextResponse.json({ error: '初始化默认单词本失败' }, { status: 500 });
      }
      defaultListId = newWordList.id;
    }

    // 更新 profiles.default_word_list_id（幂等）
    if (defaultListId && defaultListId !== existingProfile?.default_word_list_id) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ default_word_list_id: defaultListId })
        .eq('id', user.id);
      if (updateError) {
        console.error('更新默认单词本 ID 失败:', updateError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: '用户数据初始化完成'
    })

  } catch (error) {
    console.error('初始化用户数据时出错:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
