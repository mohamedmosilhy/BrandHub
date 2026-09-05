import { usePreventScreenCapture } from 'expo-screen-capture';
import { Platform } from 'react-native';

/**
 * §28 S10 — wallet, gift and payment-result screens set `FLAG_SECURE` while they are mounted, so
 * a balance or a payment outcome cannot be captured into a screenshot or a screen recording.
 *
 * Android only: `expo-screen-capture`'s prevention is a no-op on iOS, where the platform offers no
 * equivalent flag. iOS screenshot blurring is recorded as an open item rather than faked here.
 *
 * The hook lives in the composition root rather than in the screens so the screens stay free of
 * native modules and testable without one.
 */
export function useScreenProtection(): void {
  usePreventScreenCapture(
    Platform.OS === 'android' ? 'brandhub-wallet' : undefined,
  );
}
