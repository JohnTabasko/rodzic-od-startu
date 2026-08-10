import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { colors, makeType, MIN_TOUCH, radius, shadows, spacing } from '../theme/theme';

export function useType() {
  const large = useAppStore((state) => state.largeText);
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
      <View style={[styles.screenContent, pad && styles.horizontalPadding]}>{children}</View>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function HeroCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.hero, style]}>
      <View pointerEvents="none" style={[styles.heroOrb, styles.heroOrbTop]} />
      <View pointerEvents="none" style={[styles.heroOrb, styles.heroOrbBottom]} />
      <View style={styles.heroContent}>{children}</View>
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const type = useType();
  return (
    <Text style={[type.h3, styles.sectionTitle]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Kicker({
  children,
  color = colors.primary,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const type = useType();
  return <Text style={[type.kicker, { color }]}>{children}</Text>;
}

export function IconButton({
  children,
  label,
  onPress,
  style,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  secondary,
  soft,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  soft?: boolean;
}) {
  const type = useType();
  const buttonStyle = secondary
    ? styles.secondaryButton
    : soft
      ? styles.softButton
      : styles.primaryButton;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        buttonStyle,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          type.h3,
          styles.buttonText,
          secondary && styles.secondaryButtonText,
          soft && styles.softButtonText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tone = 'neutral',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'neutral' | 'sage' | 'terra' | 'gold' | 'blue' | 'lavender' | 'danger';
}) {
  const type = useType();
  const toneStyle = toneStyles[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        toneStyle,
        selected && styles.selectedChip,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[type.small, styles.chipText, selected && styles.selectedChipText]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const toneStyles = StyleSheet.create({
  neutral: { backgroundColor: colors.surfaceAlt, borderColor: colors.line },
  sage: { backgroundColor: colors.sageSoft, borderColor: colors.sageSoft },
  terra: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  gold: { backgroundColor: colors.goldSoft, borderColor: colors.goldSoft },
  blue: { backgroundColor: colors.blueSoft, borderColor: colors.blueSoft },
  lavender: { backgroundColor: colors.lavenderSoft, borderColor: colors.lavenderSoft },
  danger: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { flex: 1 },
  horizontalPadding: { paddingHorizontal: spacing(2) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadows.card,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.card,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    backgroundColor: colors.primary,
  },
  heroContent: { zIndex: 2 },
  heroOrb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.11)' },
  heroOrbTop: { width: 210, height: 210, right: -70, top: -90 },
  heroOrbBottom: {
    width: 150,
    height: 150,
    right: 35,
    bottom: -95,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: { marginTop: spacing(2), marginBottom: spacing(1) },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    ...shadows.card,
  },
  button: {
    minHeight: MIN_TOUCH + 2,
    borderRadius: radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    marginTop: spacing(1.5),
  },
  primaryButton: { backgroundColor: colors.primary, ...shadows.pop },
  secondaryButton: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line },
  softButton: { backgroundColor: colors.primarySoft },
  buttonText: { color: '#FFFFFF', textAlign: 'center' },
  secondaryButtonText: { color: colors.primary },
  softButtonText: { color: colors.primary },
  chip: {
    minHeight: 32,
    borderRadius: radius.chip,
    borderWidth: 1,
    paddingHorizontal: spacing(1.5),
    justifyContent: 'center',
    marginRight: spacing(1),
    marginBottom: spacing(0.5),
  },
  chipText: { color: colors.textMuted, fontWeight: '700' },
  selectedChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectedChipText: { color: '#FFFFFF' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  divider: { height: 1, backgroundColor: colors.line },
});
