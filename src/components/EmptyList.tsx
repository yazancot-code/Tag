import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/theme';

export default function EmptyList() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>No items yet</Text>
      <Text style={[styles.subtitle, { color: theme.textTertiary }]}>
        Hold your phone near an NFC tag to add items to your shopping list.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});