import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../auth/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { useShoppingList } from '../hooks/useShoppingList';
import { useNfcScanner } from '../hooks/useNfcScanner';
import { extractTextPayload, extractTagId } from '../services/nfc';
import { lookupArticleByNfcUid, createArticle } from '../services/articles';
import { getArticlePrices } from '../services/prices';
import { useTheme } from '../lib/theme';
import ArticleListItem from '../components/ArticleListItem';
import ScanOverlay from '../components/ScanOverlay';
import EmptyList from '../components/EmptyList';
import ArticleNamingModal from '../components/ArticleNamingModal';
import type { GovPrice } from '../types';

export default function HomeScreen() {
  const { user } = useAuth();
  const { household, loadHousehold } = useHousehold();
  const { items, loading: listLoading, fetchItems, addItem, updateQuantity, toggleChecked, removeItem } = useShoppingList(household?.id ?? null);
  const [prices, setPrices] = useState<Record<string, GovPrice | null>>({});
  const theme = useTheme();

  // Unknown tag naming modal state
  const [namingVisible, setNamingVisible] = useState(false);
  const [namingDefault, setNamingDefault] = useState('');
  const namingResolveRef = useRef<((name: string) => void) | null>(null);

  const loadPrices = useCallback(async () => {
    const priceMap: Record<string, GovPrice | null> = {};
    for (const item of items) {
      const article = item.article;
      if (article?.barcode && !priceMap[article.id]) {
        const articlePrices = await getArticlePrices(article.barcode);
        priceMap[article.id] = articlePrices.length > 0 ? articlePrices[0] : null;
      }
    }
    setPrices(priceMap);
  }, [items]);

  useEffect(() => {
    if (items.length > 0) loadPrices();
  }, [items.length, loadPrices]);

  const handleNamingSave = useCallback((name: string) => {
    namingResolveRef.current?.(name);
    namingResolveRef.current = null;
    setNamingVisible(false);
  }, []);

  const handleNamingSkip = useCallback(() => {
    namingResolveRef.current?.(namingDefault);
    namingResolveRef.current = null;
    setNamingVisible(false);
  }, [namingDefault]);

  const onTagDetected = useCallback(async (tag: any) => {
    const text = extractTextPayload(tag.ndefMessage) || extractTagId(tag);
    const nfcUid = extractTagId(tag);

    const article = await lookupArticleByNfcUid(nfcUid);

    let resolvedName: string | null = null;

    if (!article) {
      resolvedName = await new Promise<string>((resolve) => {
        namingResolveRef.current = resolve;
        setNamingDefault(text);
        setNamingVisible(true);
      });
    }

    if (resolvedName !== null) {
      const newArticle = await createArticle({
        nfc_uid: nfcUid,
        name_he: resolvedName,
        name_en: null,
      });
      if (user && household) {
        await addItem(newArticle.id, user.id);
      }
    } else if (article && user && household) {
      await addItem(article.id, user.id);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await fetchItems();
  }, [user, household, addItem, fetchItems]);

  const { scanState, countdown, scanError, startScanning } = useNfcScanner({ onTagDetected });

  useFocusEffect(
    useCallback(() => {
      if (household) fetchItems();
    }, [household, fetchItems])
  );

  useEffect(() => {
    if (user) {
      loadHousehold(user.id);
    }
  }, [user, loadHousehold]);

  useEffect(() => {
    startScanning();
  }, [startScanning]);

  const handleIncrease = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    await updateQuantity(itemId, item.quantity + 1);
  }, [items, updateQuantity]);

  const handleDecrease = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    if (item.quantity <= 1) {
      await removeItem(itemId);
    } else {
      await updateQuantity(itemId, item.quantity - 1);
    }
  }, [items, updateQuantity, removeItem]);

  const handleToggleCheck = useCallback(async (itemId: string, checked: boolean) => {
    await toggleChecked(itemId, checked);
  }, [toggleChecked]);

  const handleLongPress = useCallback((itemId: string, name: string) => {
    Alert.alert(
      'Remove Item',
      `Remove "${name}" from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(itemId) },
      ]
    );
  }, [removeItem]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleListItem
            item={item}
            price={item.article?.barcode ? prices[item.article.id] ?? undefined : undefined}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onToggleCheck={handleToggleCheck}
            onLongPress={handleLongPress}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={listLoading ? null : <EmptyList />}
      />

      <ScanOverlay
        scanState={scanState}
        countdown={countdown}
        scanError={scanError}
        onRescan={startScanning}
      />

      <ArticleNamingModal
        visible={namingVisible}
        defaultName={namingDefault}
        onSave={handleNamingSave}
        onSkip={handleNamingSkip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
});