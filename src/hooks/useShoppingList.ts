import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ShoppingItem } from '../types';

export function useShoppingList(householdId: string | null) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);

  const fetchItems = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*, article:articles(*)')
      .eq('household_id', householdId)
      .order('checked', { ascending: true })
      .order('added_at', { ascending: false });

    if (error) throw error;
    setItems(data || []);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    if (!householdId) return;

    fetchItems();

    // Set up realtime subscription
    subscriptionRef.current = supabase
      .channel(`shopping_list:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [householdId, fetchItems]);

  const addItem = async (articleId: string, userId: string) => {
    if (!householdId) return;
    const { error } = await supabase.from('shopping_list').upsert(
      {
        household_id: householdId,
        article_id: articleId,
        added_by: userId,
      },
      { onConflict: 'household_id, article_id' }
    );
    if (error) throw error;
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const { error } = await supabase
      .from('shopping_list')
      .update({ quantity })
      .eq('id', itemId);
    if (error) throw error;
  };

  const toggleChecked = async (itemId: string, checked: boolean) => {
    const { error } = await supabase
      .from('shopping_list')
      .update({ checked })
      .eq('id', itemId);
    if (error) throw error;
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  };

  return { items, loading, fetchItems, addItem, updateQuantity, toggleChecked, removeItem };
}