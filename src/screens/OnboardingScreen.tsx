import { useState } from 'react';
import { Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Screen, Card, PrimaryButton, useType } from '../components/UI';
import { useAppStore, Role, Mode, Experience } from '../store/useAppStore';
import { planPrenatalEvents } from '../data/content';
import { isValidISODate, todayISO } from '../utils/dates';
import { t } from '../i18n/pl';
import { colors, spacing } from '../theme/theme';

export default function OnboardingScreen() {
  const type = useType();
  const complete = useAppStore((s) => s.completeOnboarding);
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

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { color: colors.primary, marginTop: spacing(3) }]}>{t.appName}</Text>
        <Text style={[type.body, { marginTop: spacing(1) }]}>{t.onboarding.welcome}</Text>

        {step === 0 && (
          <Card style={{ marginTop: spacing(2) }}>
            <Text style={type.h3}>{t.onboarding.whoAreYou}</Text>
            <PrimaryButton
              title={t.onboarding.mother}
              onPress={() => {
                setRole('mother');
                setStep(1);
              }}
            />
            <PrimaryButton
              title={t.onboarding.father}
              secondary
              onPress={() => {
                setRole('father');
                setStep(1);
              }}
            />
          </Card>
        )}

        {step === 1 && (
          <Card style={{ marginTop: spacing(2) }}>
            <Text style={type.h3}>{t.onboarding.stage}</Text>
            <PrimaryButton
              title={t.onboarding.pregnancy}
              onPress={() => {
                setMode('pregnancy');
                setStep(2);
              }}
            />
            <PrimaryButton
              title={t.onboarding.child}
              secondary
              onPress={() => {
                setMode('child');
                setStep(2);
              }}
            />
          </Card>
        )}

        {step === 2 && (
          <Card style={{ marginTop: spacing(2) }}>
            <Text style={type.h3}>
              {mode === 'pregnancy' ? t.onboarding.dueDate : t.onboarding.birthDate}
            </Text>
            <TextInput
              accessibilityLabel={t.onboarding.dueDate}
              style={[styles.input, { fontSize: 16 }]}
              placeholder="np. 2026-12-01"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              value={date}
              onChangeText={setDate}
            />
            {mode === 'child' && (
              <TextInput
                accessibilityLabel={t.onboarding.childName}
                style={[styles.input, { fontSize: 16, marginTop: spacing(1) }]}
                placeholder={t.onboarding.childName}
                placeholderTextColor={colors.textMuted}
                maxLength={80}
                value={childName}
                onChangeText={setChildName}
              />
            )}
            <PrimaryButton
              title={t.onboarding.next}
              disabled={!dateValid}
              onPress={() => setStep(3)}
            />
          </Card>
        )}

        {step === 3 && (
          <Card style={{ marginTop: spacing(2) }}>
            <Text style={type.h3}>{t.onboarding.experience}</Text>
            <PrimaryButton
              title={t.onboarding.first}
              onPress={() => {
                setExperience('first');
              }}
              secondary={experience !== 'first'}
            />
            <PrimaryButton
              title={t.onboarding.experienced}
              onPress={() => {
                setExperience('experienced');
              }}
              secondary={experience !== 'experienced'}
            />
            <PrimaryButton title={t.onboarding.start} onPress={finish} />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing(1.5),
    minHeight: 52,
    marginTop: spacing(1),
    backgroundColor: colors.bg,
    color: colors.text,
  },
});
