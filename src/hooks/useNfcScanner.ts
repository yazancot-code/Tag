import { useCallback, useEffect, useRef, useState } from 'react';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { Platform } from 'react-native';

type ScanState = 'scanning' | 'tag_found' | 'timeout' | 'error' | 'unsupported';

interface UseNfcScannerOptions {
  onTagDetected: (tag: any) => Promise<void>;
}

export function useNfcScanner({ onTagDetected }: UseNfcScannerOptions) {
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [countdown, setCountdown] = useState(10);
  const [scanError, setScanError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScanningRef = useRef(false);
  const onTagDetectedRef = useRef(onTagDetected);
  onTagDetectedRef.current = onTagDetected;

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
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

        await onTagDetectedRef.current(tag);
        await NfcManager.cancelTechnologyRequest();

        if (!isMounted.current) {
          isScanningRef.current = false;
          return;
        }

        setScanState('tag_found');

        await new Promise<void>((resolve) => {
          waitTimeoutRef.current = setTimeout(resolve, 2000);
        });
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
        return;
      }
    }

    isScanningRef.current = false;
  }, []);

  return { scanState, countdown, scanError, startScanning };
}