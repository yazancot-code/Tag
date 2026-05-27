import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import * as Haptics from 'expo-haptics';
import { getAllTags, insertTag } from '../database/database';
import { extractTextPayload } from '../utils/nfc';
import type { Tag } from '../types';
import TagListItem from '../components/TagListItem';

type ScanState = 'scanning' | 'tag_found' | 'timeout' | 'error' | 'unsupported';

export default function HomeScreen() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [countdown, setCountdown] = useState(10);
  const [scanError, setScanError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScanningRef = useRef(false);

  const loadTags = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const result = await getAllTags();
      setTags(result);
    } catch {
      setError('Failed to load tags');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Keep a ref to loadTags so the scan loop always calls the latest version
  const loadTagsRef = useRef(loadTags);
  loadTagsRef.current = loadTags;

  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, [loadTags])
  );

  // Start scanning on mount
  useEffect(() => {
    startScanning();

    return () => {
      isMounted.current = false;
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = useCallback(async () => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;

    const supported = await NfcManager.isSupported();
    if (!supported) {
      if (isMounted.current) setScanState('unsupported');
      isScanningRef.current = false;
      return;
    }

    while (isMounted.current) {
      setScanState('scanning');
      setCountdown(10);
      setScanError(null);

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);

      try {
        NfcManager.setTimeout(10000);
        await NfcManager.requestTechnology(NfcTech.Ndef, {
          alertMessage:
            Platform.OS === 'ios'
              ? 'Hold your iPhone near the NFC tag.'
              : undefined,
        });

        // Tag found
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }

        if (!isMounted.current) {
          await NfcManager.cancelTechnologyRequest().catch(() => {});
          isScanningRef.current = false;
          return;
        }

        const tag = await NfcManager.getTag();
        if (!tag) {
          await NfcManager.cancelTechnologyRequest();
          if (isMounted.current) {
            setScanState('error');
            setScanError('No tag detected. Try again.');
            isScanningRef.current = false;
          }
          return;
        }

        const text = extractTextPayload(tag.ndefMessage);
        if (!text) {
          await NfcManager.cancelTechnologyRequest();
          if (isMounted.current) {
            setScanState('error');
            setScanError('No text content found on this tag.');
            isScanningRef.current = false;
          }
          return;
        }

        const tagId =
          tag.id ||
          `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

        const newTag: Tag = {
          id: tagId,
          content: text,
          tag_type: 'text/plain',
          scanned_at: new Date().toISOString(),
        };

        await insertTag(newTag);
        await NfcManager.cancelTechnologyRequest();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (!isMounted.current) {
          isScanningRef.current = false;
          return;
        }

        // Reload the tag list
        try {
          await loadTagsRef.current();
        } catch {
          // Don't break the scan cycle if list reload fails
        }

        setScanState('tag_found');

        // Wait 2 seconds before restarting the scan
        await new Promise<void>((resolve) => {
          waitTimeoutRef.current = setTimeout(resolve, 2000);
        });

        // Loop continues — auto-restart scanning
      } catch (e: any) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        await NfcManager.cancelTechnologyRequest().catch(() => {});

        if (!isMounted.current) {
          isScanningRef.current = false;
          return;
        }

        const msg = e?.message || '';
        if (
          msg.toLowerCase().includes('cancel') ||
          msg.toLowerCase().includes('timeout')
        ) {
          setScanState('timeout');
        } else {
          setScanState('error');
          setScanError(msg || 'An unexpected error occurred.');
        }

        isScanningRef.current = false;
        return; // Break the loop — user must tap Rescan / Try Again
      }
    }

    isScanningRef.current = false;
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTags(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#366092" />
        <Text style={styles.loadingText}>Loading tags…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadTags()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {tags.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No tags yet</Text>
          <Text style={styles.emptySubtitle}>
            Hold your phone near an NFC tag to start scanning.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tags}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TagListItem tag={item} />}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Scan status footer */}
      <View style={styles.footer}>
        {scanState === 'scanning' && (
          <View style={styles.footerRow}>
            <ActivityIndicator size="small" color="#366092" />
            <Text style={styles.countdownText}>Scanning… {countdown}s</Text>
          </View>
        )}
        {scanState === 'tag_found' && (
          <Text style={styles.successText}>Tag saved! Scanning again shortly…</Text>
        )}
        {scanState === 'timeout' && (
          <TouchableOpacity style={styles.footerButton} onPress={startScanning}>
            <Text style={styles.footerButtonText}>Rescan</Text>
          </TouchableOpacity>
        )}
        {scanState === 'error' && (
          <View style={styles.errorFooter}>
            <Text style={styles.errorMessage}>{scanError}</Text>
            <TouchableOpacity style={styles.footerButton} onPress={startScanning}>
              <Text style={styles.footerButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
        {scanState === 'unsupported' && (
          <Text style={styles.unsupportedText}>
            NFC is not available on this device.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f2f2f7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#888',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#366092',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownText: {
    fontSize: 15,
    color: '#366092',
    fontWeight: '600',
  },
  successText: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '600',
  },
  errorFooter: {
    alignItems: 'center',
    gap: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
  },
  footerButton: {
    backgroundColor: '#366092',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  unsupportedText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
});