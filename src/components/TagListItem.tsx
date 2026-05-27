import { StyleSheet, Text, View } from 'react-native';
import { Tag } from '../types';

interface Props {
  tag: Tag;
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

export default function TagListItem({ tag }: Props) {
  const truncated =
    tag.content.length > 120
      ? tag.content.slice(0, 120) + '…'
      : tag.content;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(tag.scanned_at)}</Text>
      </View>
      <Text style={styles.content}>{truncated}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
    color: '#222',
  },
});