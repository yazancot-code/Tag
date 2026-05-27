import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Household, HouseholdMember } from '../types';

export function useHousehold() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHousehold = async (userId: string) => {
    setLoading(true);
    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membership) {
      const { data: h } = await supabase
        .from('households')
        .select('*')
        .eq('id', membership.household_id)
        .single();

      const { data: m } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', membership.household_id);

      setHousehold(h);
      setMembers(m || []);
    }
    setLoading(false);
  };

  const createHousehold = async (name: string, userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('SESSION:', JSON.stringify(session));

    const { data: h, error } = await supabase
      .from('households')
      .insert({ name, created_by: userId })
      .select()
      .single();

    console.log('INSERT RESULT:', JSON.stringify({ data: h, error }));
    if (error) throw error;

    await supabase
      .from('household_members')
      .insert({ household_id: h.id, user_id: userId, role: 'owner' });

    setHousehold(h);
    return h;
  };

  const joinByCode = async (code: string, userId: string) => {
    const { data: h } = await supabase
      .from('households')
      .select('*')
      .eq('invite_code', code)
      .maybeSingle();

    if (!h) throw new Error('Invalid invite code');

    await supabase
      .from('household_members')
      .insert({ household_id: h.id, user_id: userId, role: 'member' });

    setHousehold(h);
    return h;
  };

  return { household, members, loading, loadHousehold, createHousehold, joinByCode };
}