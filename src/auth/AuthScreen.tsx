import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from './useAuth';
import { useTheme } from '../lib/theme';

export default function AuthScreen() {
  const { signIn, loading } = useAuth();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.accent }]}>Tag</Text>
      <Text style={[styles.subtitle, { color: theme.textTertiary }]}>Family Shopping List</Text>
      <TouchableOpacity
        style={[styles.googleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={signIn}
        disabled={loading}
      >
        <Text style={[styles.googleButtonText, { color: theme.text }]}>
          {loading ? 'Loading…' : 'Sign in with Google'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 48,
  },
  googleButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});