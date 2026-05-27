import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tag } from '../types';

interface Props {
  tag: Tag;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
}

export default function TagListItem({ tag, onIncrease, onDecrease }: Props) {
  const truncated =
    tag.content.length > 200
      ? tag.content.slice(0, 200) + '…'
      : tag.content;

  return (
    <View style={styles.container}>
      <View style={styles.bodyRow}>
        <Text style={styles.content} numberOfLines={2}>
          {truncated}
        </Text>

        <View style={styles.controls}>
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
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    fontSize: 20,
    lineHeight: 28,
    color: '#222',
    flex: 1,
    marginRight: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#366092',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    minWidth: 24,
    textAlign: 'center',
  },
});