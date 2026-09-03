import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Modal as NativeModal,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { Pressable, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export type CardProps = {
  children: ReactNode;
  accessibilityLabel?: string;
  elevated?: boolean;
};

export function Card({
  children,
  accessibilityLabel,
  elevated = false,
}: CardProps) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        boxShadow: elevated ? theme.shadows.card.boxShadow : undefined,
        padding: theme.spacing.x4,
      }}
    >
      {children}
    </View>
  );
}

export type ModalProps = {
  visible: boolean;
  title: string;
  closeLabel: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({
  visible,
  title,
  closeLabel,
  children,
  onClose,
}: ModalProps) {
  const { theme, direction } = useTheme();
  return (
    <NativeModal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View
        style={[
          styles.centered,
          { backgroundColor: theme.colors.ink40, direction },
        ]}
      >
        <View
          accessibilityRole="summary"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            gap: theme.spacing.x4,
            margin: theme.spacing.x6,
            maxWidth: theme.layout.containerMax,
            padding: theme.spacing.x5,
          }}
        >
          <Text variant="h3" weight="bold">
            {title}
          </Text>
          {children}
          <Pressable
            accessibilityLabel={closeLabel}
            onPress={onClose}
            style={styles.action}
          >
            <Text color={theme.colors.accent} weight="semibold">
              {closeLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </NativeModal>
  );
}

/**
 * The prototype's bottom sheet: a 40x4 grab handle, `22px 22px 0 0` corners,
 * `padding: 14px 18px 22px`, a `14px / 800` title and a text action on the far side. The
 * scrim is `rgba(26,26,46,.42)` and dismisses on tap.
 */
export type SheetProps = ModalProps & {
  /** The prototype puts a text action — "Clear filters" — opposite the sheet's title. */
  actionLabel?: string;
  onAction?: (() => void) | undefined;
};

export function Sheet({
  visible,
  title,
  closeLabel,
  children,
  onClose,
  actionLabel,
  onAction,
}: SheetProps) {
  const { theme, direction } = useTheme();
  const { height } = useWindowDimensions();
  const sheet = theme.mobile.sheet;
  // The prototype's filter sheet measures 549 pt of an 876 pt screen — 63%. Its content is
  // fixed, so on a shorter phone, or at a large accessibility text size, the same stack would
  // run past the top of the screen. Capping it near the prototype's proportion and scrolling
  // the overflow keeps the drawn sheet the reference's size on every device.
  const maxHeight = Math.round(height * 0.72);
  return (
    <NativeModal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={[styles.sheetRoot, { direction }]}>
        <Pressable
          accessibilityLabel={closeLabel}
          onPress={onClose}
          style={[styles.scrim, { backgroundColor: 'rgba(26,26,46,0.42)' }]}
        >
          <View />
        </Pressable>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopStartRadius: sheet.radius,
            borderTopEndRadius: sheet.radius,
            maxHeight,
            paddingTop: sheet.paddingTop,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              backgroundColor: theme.colors.border,
              borderRadius: theme.radius.full,
              height: sheet.handleHeight,
              width: sheet.handleWidth,
            }}
          />
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: theme.spacing.x4,
              paddingBottom: sheet.paddingBottom,
              paddingHorizontal: sheet.paddingX,
              paddingTop: theme.spacing.x4,
            }}
          >
            <View style={styles.sheetHeader}>
              <Text variant="body" weight="extrabold">
                {title}
              </Text>
              {actionLabel ? (
                <Pressable
                  accessibilityLabel={actionLabel}
                  compact
                  onPress={onAction}
                  style={styles.action}
                >
                  <Text
                    color={theme.colors.accentHover}
                    variant="xs"
                    weight="bold"
                  >
                    {actionLabel}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {children}
          </ScrollView>
        </View>
      </View>
    </NativeModal>
  );
}

export type GradientPanelProps = {
  children: ReactNode;
  accessibilityLabel?: string;
  soft?: boolean;
  radius?: number;
  paddingX?: number;
  paddingY?: number;
  /** The home promo bleeds a decorative outline circle off its leading top corner. */
  ring?: boolean;
};

export function GradientPanel({
  children,
  accessibilityLabel,
  soft = false,
  radius,
  paddingX,
  paddingY,
  ring = false,
}: GradientPanelProps) {
  const { theme } = useTheme();
  const gradient = soft ? theme.gradients.brandSoft : theme.gradients.brand;
  const promo = theme.mobile.promo;
  return (
    <LinearGradient
      accessibilityLabel={accessibilityLabel}
      colors={gradient.colors}
      end={gradient.end}
      start={gradient.start}
      style={{
        borderRadius: radius ?? theme.radius.lg,
        overflow: 'hidden',
        paddingHorizontal: paddingX ?? theme.spacing.x5,
        paddingVertical: paddingY ?? theme.spacing.x5,
      }}
    >
      {ring ? (
        <View
          pointerEvents="none"
          style={{
            borderColor: 'rgba(255,255,255,0.2)',
            borderRadius: theme.radius.full,
            borderWidth: 2,
            height: promo.ringSize,
            insetInlineStart: promo.ringInsetStart,
            position: 'absolute',
            top: promo.ringTop,
            width: promo.ringSize,
          }}
        />
      ) : null}
      {children}
    </LinearGradient>
  );
}

export function Divider() {
  const { theme } = useTheme();
  return <View style={{ backgroundColor: theme.colors.border, height: 1 }} />;
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, justifyContent: 'center' },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scrim: { bottom: 0, end: 0, position: 'absolute', start: 0, top: 0 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
});
