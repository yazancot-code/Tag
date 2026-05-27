import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Household, HouseholdMember } from '../types';

interface HouseholdContextType {
    household: Household | null;
    members: HouseholdMember[];
    loading: boolean;
    loadHousehold: (userId: string) => Promise<void>;
    createHousehold: (name: string, userId: string) => Promise<Household>;
    joinByCode: (code: string, userId: string) => Promise<Household>;
}

const HouseholdContext = createContext<HouseholdContextType | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
    const [household, setHousehold] = useState<Household | null>(null);
    const [members, setMembers] = useState<HouseholdMember[]>([]);
    const [loading, setLoading] = useState(true);

    const loadHousehold = async (userId: string) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('loadHousehold session:', session?.access_token ? 'HAS TOKEN' : 'NO TOKEN');

            const { data: membership, error: membershipError } = await supabase
                .from('household_members')
                .select('household_id')
                .eq('user_id', userId)
                .maybeSingle();

            console.log('membership:', JSON.stringify({ membership, membershipError }));

            if (membership) {
                const { data: h, error: householdError } = await supabase
                    .from('households')
                    .select('*')
                    .eq('id', membership.household_id)
                    .single();

                console.log('household:', JSON.stringify({ h, householdError }));

                const { data: m } = await supabase
                    .from('household_members')
                    .select('*')
                    .eq('household_id', membership.household_id);

                setHousehold(h);
                setMembers(m || []);
            }
        } finally {
            setLoading(false);
        }
    };

    const createHousehold = async (name: string, userId: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('createHousehold session:', session?.access_token ? 'HAS TOKEN' : 'NO TOKEN');

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

    return (
        <HouseholdContext.Provider value={{ household, members, loading, loadHousehold, createHousehold, joinByCode }}>
            {children}
        </HouseholdContext.Provider>
    );
}

export function useHousehold() {
    const ctx = useContext(HouseholdContext);
    if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
    return ctx;
}