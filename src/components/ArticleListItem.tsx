import * as Haptics from 'expo-haptics';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { GovPrice, ShoppingItem } from '../types';
import { useTheme } from '../lib/theme';

interface Props {
  item: ShoppingItem;
  price?: GovPrice;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onToggleCheck: (id: string, checked: boolean) => void;
  onLongPress?: (id: string, name: string) => void;
}

export default function ArticleListItem({ item, price, onIncrease, onDecrease, onToggleCheck, onLongPress }: Props) {
  const theme = useTheme();
  const article = item.article;
  const name = article?.name_he || article?.name_en || 'Unknown item';
  const checked = item.checked;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleCheck(item.id, !checked);
  };

  const priceDisplay = price?.price
    ? `₪${Number(price.price).toFixed(2)}`
    : null;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.surface }, checked && styles.checkedContainer]}
      onLongPress={() => onLongPress?.(item.id, name)}
      delayLongPress={500}
      activeOpacity={0.8}
    >
      <View style={styles.bodyRow}>
        {/* Article image with fallback */}
        {article?.image_url ? (
          <Image
            source={{ uri: article.image_url }}
            style={[styles.imagePlaceholder, { backgroundColor: theme.accentLight }]}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.placeholderBg }]}>
            <Text style={[styles.imagePlaceholderText, { color: theme.placeholderText }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.info}>
          <Text
            style={[styles.name, { color: theme.text }, checked && styles.checkedText]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {priceDisplay && (
            <Text style={[styles.price, { color: theme.price }]}>{priceDisplay}</Text>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.roundButton, { backgroundColor: theme.accent }]}
            onPress={() => onDecrease(item.id)}
          >
            <Text style={styles.buttonText}>−</Text>
          </TouchableOpacity>

          <Text style={[styles.quantityText, { color: theme.text }]}>{item.quantity}</Text>

          <TouchableOpacity
            style={[styles.roundButton, { backgroundColor: theme.accent }]}
            onPress={() => onIncrease(item.id)}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.checkButton, { borderColor: checked ? theme.accent : theme.border }]}
          onPress={handleToggle}
        >
          <Text style={[styles.checkText, { color: theme.accent }]}>{checked ? '✓' : '○'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  checkedContainer: {
    opacity: 0.5,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  price: {
    fontSize: 13,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
  checkButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 16,
    fontWeight: '700',
  },
});