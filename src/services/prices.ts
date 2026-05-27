import { supabase } from '../lib/supabase';
import type { GovPrice } from '../types';

export async function getArticlePrices(barcode: string): Promise<GovPrice[]> {
  const { data, error } = await supabase
    .from('gov_prices')
    .select('*')
    .eq('barcode', barcode)
    .order('price', { ascending: true });

  if (error) throw error;
  return data || [];
}