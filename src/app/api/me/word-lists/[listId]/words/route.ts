import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError, createValidationError } from '@/lib/errors';

export async function GET(req: NextRequest, { params }: { params: { listId: string } }) {
  try {
    const { supabase, user } = await validateAuth(req);
    const listId = parseInt(params.listId, 10);
    if (isNaN(listId) || listId <= 0) {
      throw createValidationError('无效的 listId');
    }

    // First, get the total number of words in the list for this user.
    const { count: totalCount, error: countError } = await supabase
      .from('user_word_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('word_list_id', listId);

    if (countError) throw countError;

    // Now, fetch the unlearned words (state = 0) from that list for this user.
    const { data: unlearnedProgress, error: wordsError } = await supabase
      .from('user_word_progress')
      .select(`
        words (*)
      `)
      .eq('user_id', user.id)
      .eq('word_list_id', listId)
      .eq('state', 0) // Only get new words
      .order('created_at', { referencedTable: 'words', ascending: true });

    if (wordsError) throw wordsError;

    const words = unlearnedProgress ? unlearnedProgress.map((item: any) => item.words).filter(Boolean) : [];
    
    return NextResponse.json({
      words: words,
      meta: {
        total_in_list: totalCount ?? 0,
        unlearned_count: words.length,
        has_learned_all: (totalCount ?? 0) > 0 && words.length === 0,
      }
    });

  } catch (e) {
    return handleApiError(e);
  }
}


