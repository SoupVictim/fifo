import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { ParsedExpiryResult, parseExpiryDateFromText } from './dateParser';

export interface OcrScanResponse {
  rawText: string;
  parsed: ParsedExpiryResult | null;
  engine: 'mlkit-native' | 'scene-ocr' | 'none';
}

/**
 * Attempts on-device Google ML Kit text recognition if running in a native build
 * where @react-native-ml-kit/text-recognition is linked; otherwise falls back to
 * neural scene-text OCR (Engine 2) which works directly inside Expo Go.
 */
export async function recognizeExpiryFromImage(options: {
  uri?: string;
  base64?: string;
}): Promise<OcrScanResponse> {
  // 1. Try On-Device Google ML Kit first (when running outside Expo Go storeClient)
  if (
    Platform.OS !== 'web' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    options.uri
  ) {
    try {
      // Dynamic require so Expo Go never crashes if native module isn't bundled
      const mlkitName = '@react-native-ml-kit/text-recognition';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const TextRecognition = require(mlkitName)?.default;
      if (TextRecognition && typeof TextRecognition.recognize === 'function') {
        const result = await TextRecognition.recognize(options.uri);
        const text: string = result?.text || '';
        const parsed = parseExpiryDateFromText(text);
        return {
          rawText: text,
          parsed,
          engine: 'mlkit-native',
        };
      }
    } catch {
      // Fall through to scene-text OCR
    }
  }

  // 2. Scene-Text OCR (works inside Expo Go on Android & iOS via base64 frame capture)
  if (options.base64) {
    try {
      const formData = new FormData();
      formData.append('base64Image', `data:image/jpeg;base64,${options.base64}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('OCREngine', '2'); // Engine 2 is optimized for numbers, dates & packaging labels
      formData.append('scale', 'true');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          apikey: 'helloworld',
        },
        body: formData,
      });

      if (response.ok) {
        const json = await response.json();
        const parsedResults = json?.ParsedResults;
        if (Array.isArray(parsedResults) && parsedResults.length > 0) {
          const combinedText = parsedResults
            .map((r: any) => r?.ParsedText || '')
            .join('\n')
            .trim();
          const parsed = parseExpiryDateFromText(combinedText);
          return {
            rawText: combinedText,
            parsed,
            engine: 'scene-ocr',
          };
        }
      }
    } catch {
      // Network error or timeout
    }
  }

  return {
    rawText: '',
    parsed: null,
    engine: 'none',
  };
}
