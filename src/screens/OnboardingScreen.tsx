import { useState } from 'react';
import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Kicker, PrimaryButton, Screen, useType } from '../components/UI';
import { useAppStore, Experience, Mode, Role } from '../store/useAppStore';
import { planPrenatalEvents } from '../data/content';
import { isValidISODate, todayISO } from '../utils/dates';
import { colors, radius, spacing } from '../theme/theme';
import { t } from '../i18n/pl';

export default function OnboardingScreen() {
  const type = useType();
  const complete = useAppStore((state) => state.completeOnboarding);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [date, setDate] = useState('');
  const [childName, setChildName] = useState('');
  const [experience, setExperience] = useState<Experience>('first');

  const dateValid = isValidISODate(date) && (mode !== 'child' || date <= todayISO());

  const finish = () => {
    if (!role || !mode || !dateValid) return;
    const profile = {
      role,
      mode,
      experience,
      childName: childName.trim() || undefined,
      ...(mode === 'pregnancy' ? { dueDate: date } : { birthDate: date }),
    };
    const planned =
      mode === 'pregnancy'
        ? planPrenatalEvents(date)
        : [
            {
              id: 'birth',
              title: `🎂 Narodziny ${childName.trim() || 'maluszka'}`,
              date,
              type: 'kamień milowy',
            },
          ];
    complete(profile, planned);
  };

  const stepCopy = [
    {
      kicker: 'Kim jesteś?',
      title: 'Witaj w Gniazdku',
      subtitle: 'Dopasujemy treści, przypomnienia i plan do Twojej roli.',
    },
    {
      kicker: 'Wasz etap',
      title: 'Na jakim jesteście etapie?',
      subtitle: 'Wybierz ścieżkę — resztę dopasujemy automatycznie.',
    },
    {
      kicker: 'Wasza data',
      title: mode === 'pregnancy' ? 'Kiedy termin porodu?' : 'Kiedy urodził się maluch?',
      subtitle: 'Data pomoże nam przygotować spokojny plan na kolejne tygodnie.',
    },
    {
      kicker: 'Wasza historia',
      title: 'Czy to Wasze pierwsze dziecko?',
      subtitle: 'To pozwoli nam dobrać tempo i poziom podpowiedzi.',
    },
  ][step];

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name="home-heart" size={42} color={colors.primary} />
        </View>
        <Kicker>{stepCopy.kicker}</Kicker>
        <Text style={[type.h1, styles.title]}>{stepCopy.title}</Text>
        <Text style={[type.body, styles.subtitle]}>{stepCopy.subtitle}</Text>

        {step === 0 && (
          <View>
            <OptionCard
              icon="human-female"
              title={t.onboarding.mother}
              description="Ciąża, poród, karmienie i opieka nad dzieckiem"
              selected={role === 'mother'}
              tone="terra"
              onPress={() => setRole('mother')}
            />
            <OptionCard
              icon="human-male"
              title={t.onboarding.father}
              description="Wsparcie partnerki, poród i opieka nad maluchem"
              selected={role === 'father'}
              tone="blue"
              onPress={() => setRole('father')}
            />
          </View>
        )}

        {step === 1 && (
          <View>
            <OptionCard
              icon="heart-outline"
              title={t.onboarding.pregnancy}
              description="Tydzień po tygodniu, plan badań i przygotowanie do porodu"
              selected={mode === 'pregnancy'}
              tone="terra"
              onPress={() => setMode('pregnancy')}
            />
            <OptionCard
              icon="baby-face-outline"
              title={t.onboarding.child}
              description="Rozwój miesiąc po miesiącu, kamienie milowe i zabawa"
              selected={mode === 'child'}
              tone="sage"
              onPress={() => setMode('child')}
            />
          </View>
        )}

        {step === 2 && (
          <Card style={styles.dateCard}>
            <Text style={type.h3}>
              {mode === 'pregnancy' ? t.onboarding.dueDate : t.onboarding.birthDate}
            </Text>
            <TextInput
              accessibilityLabel={
                mode === 'pregnancy' ? t.onboarding.dueDate : t.onboarding.birthDate
              }
              style={styles.input}
              placeholder="np. 2026-12-01"
              placeholderTextColor={colors.textFaint}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              value={date}
              onChangeText={setDate}
            />
            {mode === 'child' && (
              <TextInput
                accessibilityLabel={t.onboarding.childName}
                style={[styles.input, { marginTop: spacing(1) }]}
                placeholder={t.onboarding.childName}
                placeholderTextColor={colors.textFaint}
                maxLength={80}
                value={childName}
                onChangeText={setChildName}
              />
            )}
            <Text style={[type.small, styles.inputHint]}>
              {dateValid ? 'Data wygląda poprawnie.' : 'Wpisz datę w formacie RRRR-MM-DD.'}
            </Text>
          </Card>
        )}

        {step === 3 && (
          <View>
            <OptionCard
              icon="numeric-1-circle-outline"
              title={t.onboarding.first}
              description="Dostaniesz więcej kontekstu i prostych wyjaśnień."
              selected={experience === 'first'}
              tone="gold"
              onPress={() => setExperience('first')}
            />
            <OptionCard
              icon="repeat-variant"
              title={t.onboarding.experienced}
              description="Pokażemy skróty i skupimy się na tym, co nowe."
              selected={experience === 'experienced'}
              tone="sage"
              onPress={() => setExperience('experienced')}
            />
          </View>
        )}

        <View style={styles.dots}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={[styles.dot, item === step && styles.dotActive]} />
          ))}
        </View>
        <PrimaryButton
          title={step === 3 ? 'Rozpocznij podróż' : t.onboarding.next}
          disabled={(step === 0 && !role) || (step === 1 && !mode) || (step === 2 && !dateValid)}
          onPress={() => (step === 3 ? finish() : setStep((current) => current + 1))}
        />
      </ScrollView>
    </Screen>
  );
}

function OptionCard({
  icon,
  title,
  description,
  selected,
  tone,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  selected: boolean;
  tone: 'terra' | 'blue' | 'sage' | 'gold';
  onPress: () => void;
}) {
  const palette = {
    terra: { soft: colors.primarySoft, deep: colors.primary },
    blue: { soft: colors.blueSoft, deep: colors.blueDeep },
    sage: { soft: colors.sageSoft, deep: colors.sageDeep },
    gold: { soft: colors.goldSoft, deep: colors.goldDeep },
  }[tone];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        selected && { borderColor: palette.deep, backgroundColor: palette.soft },
      ]}
    >
      <View style={[styles.optionIcon, { backgroundColor: selected ? '#FFFFFF' : palette.soft }]}>
        <MaterialCommunityIcons name={icon} size={26} color={palette.deep} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <MaterialCommunityIcons
        name={selected ? 'check-circle' : 'circle-outline'}
        size={24}
        color={selected ? palette.deep : colors.textFaint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing(3), paddingBottom: spacing(4) },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(2),
  },
  title: { marginTop: spacing(0.5), marginBottom: spacing(1) },
  subtitle: { color: colors.textMuted, marginBottom: spacing(2.5) },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 20,
    padding: spacing(1.5),
    marginBottom: spacing(1.5),
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: { flex: 1 },
  optionTitle: { fontSize: 16, lineHeight: 21, fontWeight: '800', color: colors.text },
  optionDescription: { marginTop: 3, fontSize: 12.5, lineHeight: 18, color: colors.textMuted },
  dateCard: { marginTop: spacing(1) },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.control,
    paddingHorizontal: spacing(1.5),
    minHeight: 52,
    marginTop: spacing(1),
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: 16,
  },
  inputHint: { marginTop: spacing(1), color: colors.textFaint },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: spacing(3),
    marginBottom: spacing(0.5),
  },
  dot: { width: 8, height: 8, borderRadius: 99, backgroundColor: '#E2D5C4' },
  dotActive: { width: 26, backgroundColor: colors.primaryLight },
});
