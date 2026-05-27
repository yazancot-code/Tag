import { Ndef } from 'react-native-nfc-manager';

/** Extract the first text payload from an NDEF message. */
export function extractTextPayload(
  ndefMessage: any[]
): string | null {
  if (!ndefMessage || ndefMessage.length === 0) return null;

  for (const record of ndefMessage) {
    try {
      const text = Ndef.text.decodePayload(record.payload);
      if (text) return text;
    } catch {
      // Skip records that aren't decodable text
    }
  }
  return null;
}