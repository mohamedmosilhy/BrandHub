import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@presentation/components/controls';
import { Icon, type IconName, Text } from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export function Spinner({
  accessibilityLabel,
}: {
  accessibilityLabel: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}

export type SkeletonProps = {
  accessibilityLabel: string;
  height?: number;
  width?: number | `${number}%`;
};

export function Skeleton({ accessibilityLabel, height, width }: SkeletonProps) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={{
        backgroundColor: theme.colors.border,
        borderRadius: theme.radius.md,
        height: height ?? theme.spacing.x12,
        width: width ?? '100%',
      }}
    />
  );
}

export type StateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: (() => void) | undefined;
  icon?: IconName;
};

function StateContent({
  title,
  body,
  actionLabel,
  onAction,
  icon = 'warning',
}: StateProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.state,
        { gap: theme.spacing.x3, padding: theme.spacing.x6 },
      ]}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.accentLight,
          borderRadius: theme.radius.full,
          height: theme.spacing.x16,
          justifyContent: 'center',
          width: theme.spacing.x16,
        }}
      >
        <Icon name={icon} color={theme.colors.accent} />
      </View>
      <Text align="center" variant="h3" weight="bold">
        {title}
      </Text>
      <Text align="center" color={theme.colors.textSubtleAccessible}>
        {body}
      </Text>
      {actionLabel ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function EmptyState(props: StateProps) {
  return <StateContent {...props} icon={props.icon ?? 'cart'} />;
}

export function ErrorState(props: StateProps) {
  return <StateContent {...props} icon={props.icon ?? 'warning'} />;
}

export function OfflineBanner({ message }: { message: string }) {
  const { theme } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={message}
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.warningLight,
          gap: theme.spacing.x2,
          paddingHorizontal: theme.spacing.x4,
          paddingVertical: theme.spacing.x2,
        },
      ]}
    >
      <Icon
        name="warning"
        color={theme.colors.warning}
        size={theme.iconSizes.sm}
      />
      <Text color={theme.colors.textPrimary} variant="sm">
        {message}
      </Text>
    </View>
  );
}

export type AsyncBoundaryProps = {
  status: 'pending' | 'error' | 'success';
  isEmpty?: boolean;
  loading: ReactNode;
  empty: ReactNode;
  error: ReactNode;
  children: ReactNode;
};

export function AsyncBoundary({
  status,
  isEmpty = false,
  loading,
  empty,
  error,
  children,
}: AsyncBoundaryProps) {
  if (status === 'pending') return <>{loading}</>;
  if (status === 'error') return <>{error}</>;
  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', flexDirection: 'row' },
  state: { alignItems: 'center', justifyContent: 'center' },
});
