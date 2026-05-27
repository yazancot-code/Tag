import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/useAuth';
import { useHousehold } from '../context/HouseholdContext';  // ← updated path
import { useTheme } from '../lib/theme';
import HouseholdBadge from '../components/HouseholdBadge';
import type { HouseholdMember as HouseholdMemberType } from '../types';

const CHAINS = [
  { id: 'shufersal', name: 'Shufersal' },
  { id: 'rami_levy', name: 'Rami Levy' },
  { id: 'victory', name: 'Victory' },
  { id: 'yeinot_bitan', name: 'Yeinot Bitan' },
  { id: 'coop', name: 'Co-op' },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { household, members, loading, createHousehold, joinByCode } = useHousehold();  // ← removed loadHousehold
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [preferredChain, setPreferredChain] = useState<string | null>(null);
  const theme = useTheme();

  // ← removed useEffect that called loadHousehold

  useEffect(() => {
    if (household?.preferred_chain) {
      setPreferredChain(household.preferred_chain);
    }
  }, [household]);

  const handleCreateHousehold = async () => {
    if (!householdName.trim() || !user) return;
    try {
      const h = await createHousehold(householdName.trim(), user.id);
      Alert.alert('Household created!', `Invite code: ${h.invite_code}`);  // ← use returned h, not stale state
      setHouseholdName('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim() || !user) return;
    try {
      await joinByCode(inviteCode.trim(), user.id);
      Alert.alert('Joined!', 'You are now a member of this household.');
      setInviteCode('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleShareInvite = async () => {
    if (!household) return;
    try {
      await Share.share({
        message: `Join my household "${household.name}" on Tag! Use invite code: ${household.invite_code}`,
      });
    } catch { }
  };

  const handleChainChange = async (chainId: string) => {
    if (!household) return;
    setPreferredChain(chainId);
    await supabase
      .from('households')
      .update({ preferred_chain: chainId } as any)
      .eq('id', household.id);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {household && (
        <View style={styles.section}>
          <HouseholdBadge household={household} memberCount={members.length} />
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={handleShareInvite}>
            <Text style={styles.buttonText}>Share Invite Code</Text>
          </TouchableOpacity>
          <Text style={[styles.inviteCode, { color: theme.accent }]}>
            Invite code: {household.invite_code}
          </Text>
        </View>
      )}

      {!household && (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Create a Household</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Family name"
              placeholderTextColor={theme.textTertiary}
              value={householdName}
              onChangeText={setHouseholdName}
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={handleCreateHousehold}>
              <Text style={styles.buttonText}>Create</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Join a Household</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="Invite code"
              placeholderTextColor={theme.textTertiary}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={handleJoinHousehold}>
              <Text style={styles.buttonText}>Join</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {household && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferred Chain</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textTertiary }]}>
              Prices shown from this supermarket
            </Text>
            <View style={styles.chainsGrid}>
              {CHAINS.map((chain) => (
                <TouchableOpacity
                  key={chain.id}
                  style={[
                    styles.chainChip,
                    {
                      backgroundColor: preferredChain === chain.id ? theme.accent : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handleChainChange(chain.id)}
                >
                  <Text
                    style={[
                      styles.chainText,
                      { color: preferredChain === chain.id ? '#fff' : theme.text },
                    ]}
                  >
                    {chain.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Members</Text>
            {members.map((m: HouseholdMemberType) => (
              <View key={m.user_id} style={styles.memberRow}>
                <View style={[styles.memberAvatar, { backgroundColor: theme.accentLight }]}>
                  <Text style={[styles.memberAvatarText, { color: theme.accent }]}>
                    {m.user_id.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: theme.text }]}>
                    {m.user_id.slice(0, 8)}
                  </Text>
                  <Text style={[styles.memberRole, { color: theme.textTertiary }]}>
                    {m.role === 'owner' ? 'Owner' : 'Member'} · Joined {formatDate(m.joined_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  section: {
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: -8,
  },
  input: {
    width: '100%',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  inviteCode: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  chainsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chainChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chainText: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 13,
    marginTop: 2,
  },
  signOutButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  signOutText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '600',
  },
});