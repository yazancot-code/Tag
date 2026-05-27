import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tag } from '../types';

interface Props {
  tag: Tag;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TagListItem({ tag, onIncrease, onDecrease }: Props) {
  const truncated =
    tag.content.length > 200
      ? tag.content.slice(0, 200) + '…'
      : tag.content;

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{formatDate(tag.scanned_at)}</Text>

      <Text style={styles.content}>{truncated}</Text>

      <View style={styles.quantityRow}>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => onDecrease(tag.id)}
        >
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>

        <Text style={styles.quantityText}>{tag.quantity}</Text>

        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => onIncrease(tag.id)}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  content: {
    fontSize: 20,
    lineHeight: 28,
    color: '#222',
    textAlign: 'center',
    marginBottom: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#366092',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 28,
  },
  quantityText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    minWidth: 30,
    textAlign: 'center',
  },
});