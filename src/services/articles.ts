import { supabase } from '../lib/supabase';
import type { Article } from '../types';

export async function lookupArticleByNfcUid(nfcUid: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('nfc_uid', nfcUid)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function lookupByBarcode(barcode: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createArticle(article: Partial<Article>): Promise<Article> {
  const { data, error } = await supabase
    .from('articles')
    .insert(article)
    .select()
    .single();

  if (error) throw error;
  return data;
}