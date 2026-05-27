import { StyleSheet, Text, View } from 'react-native';
import type { Household } from '../types';

interface Props {
  household: Household;
  memberCount: number;
}

export default function HouseholdBadge({ household, memberCount }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{household.name}</Text>
      <Text style={styles.count}>{memberCount} {memberCount === 1 ? 'member' : 'members'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  count: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
});