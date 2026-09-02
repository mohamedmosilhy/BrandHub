import {
  Icon,
  type IconName,
  Pressable,
} from '@presentation/components/primitives';
import { useTheme } from '@presentation/theme';

export type IconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: (() => void) | undefined;
  selected?: boolean;
  disabled?: boolean;
  testID?: string | undefined;
};

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  selected = false,
  disabled = false,
  testID,
}: IconButtonProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={{
        alignItems: 'center',
        backgroundColor: selected
          ? theme.colors.accentLight
          : theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        justifyContent: 'center',
      }}
    >
      <Icon
        name={icon}
        color={selected ? theme.colors.accent : theme.colors.textPrimary}
        filled={selected && icon === 'heart'}
      />
    </Pressable>
  );
}
