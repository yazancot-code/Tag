import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../lib/theme';

type ScanState = 'scanning' | 'tag_found' | 'timeout' | 'error' | 'unsupported';

interface Props {
  scanState: ScanState;
  countdown: number;
  scanError: string | null;
  onRescan: () => void;
}

function PulsingRing() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.pulsingRing,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  );
}

export default function ScanOverlay({ scanState, countdown, scanError, onRescan }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.overlayBg, borderTopColor: theme.border }]}>
      {scanState === 'scanning' && (
        <View style={styles.row}>
          <View style={styles.ringContainer}>
            <PulsingRing />
            <View style={[styles.ringDot, { backgroundColor: '#2e7d32' }]} />
          </View>
          <Text style={[styles.scanningText, { color: theme.accent }]}>
            Scanning… {countdown}s
          </Text>
        </View>
      )}
      {scanState === 'tag_found' && (
        <View style={styles.row}>
          <View style={styles.ringContainer}>
            <View style={styles.foundDot} />
          </View>
          <Text style={styles.foundText}>Tag found! Scanning again shortly…</Text>
        </View>
      )}
      {scanState === 'timeout' && (
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={onRescan}>
          <Text style={styles.buttonText}>Rescan</Text>
        </TouchableOpacity>
      )}
      {scanState === 'error' && (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{scanError}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={onRescan}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
      {scanState === 'unsupported' && (
        <Text style={[styles.unsupportedText, { color: theme.textTertiary }]}>
          NFC is not available on this device.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ringContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#2e7d32',
  },
  ringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  foundDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2e7d32',
  },
  scanningText: {
    fontSize: 15,
    fontWeight: '600',
  },
  foundText: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '600',
  },
  errorRow: {
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  unsupportedText: {
    fontSize: 15,
    textAlign: 'center',
  },
});