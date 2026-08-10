import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, makeType, radius, MIN_TOUCH } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';

export function useType() {
  const large = useAppStore((s) => s.largeText);
  return makeType(large ? 1.25 : 1);
}

export function Screen({
  children,
  pad = true,
  style,
}: {
  children: React.ReactNode;
  pad?: boolean;
  style?: ViewStyle;
}) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>
      <View style={[pad && { paddingHorizontal: spacing(2) }, { flex: 1 }]}>{children}</View>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const type = useType();
  return (
    <Text
      style={[type.h3, { marginTop: spacing(2), marginBottom: spacing(1) }]}
      accessibilityRole="header"
    >
      {children}
    </Text>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  secondary,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const type = useType();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary && {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        },
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[type.h3, { color: secondary ? colors.primary : '#fff', textAlign: 'center' }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const type = useType();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
    >
      <Text style={[type.small, { color: selected ? '#fff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    minHeight: MIN_TOUCH + 8,
    justifyContent: 'center',
    paddingHorizontal: spacing(2),
    marginTop: spacing(1.5),
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chip,
    paddingHorizontal: spacing(1.5),
    minHeight: 36,
    justifyContent: 'center',
    marginRight: spacing(1),
    backgroundColor: colors.surface,
  },
});
