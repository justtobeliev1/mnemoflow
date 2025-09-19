import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError, createValidationError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { supabase, user } = await validateAuth();
    const raw = params.name ?? '';
    const decoded = decodeURIComponent(raw);
    if (!decoded) {
      throw createValidationError('无效的名称', 'name不能为空');
    }

    const { data, error } = await supabase
      .from('word_lists')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', decoded)
      .single();

    if (error) {
      return NextResponse.json({ message: '未找到单词本' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return handleApiError(e);
  }
}


