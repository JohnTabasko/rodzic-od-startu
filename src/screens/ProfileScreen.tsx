import React from 'react';
import { ScrollView, Text, Switch, Alert } from 'react-native';
import { Screen, Card, PrimaryButton, useType } from '../components/UI';
import CoupleSection from './CoupleSection';
import { useAppStore } from '../store/useAppStore';
import { pregnancyWeek, childAgeMonths, formatPL } from '../utils/dates';
import { t } from '../i18n/pl';
import { colors, spacing } from '../theme/theme';

export default function ProfileScreen() {
  const type = useType();
  const { profile, largeText, setLargeText, exportJSON, resetAll, events, notes, moods } = useAppStore();
  if (!profile) return null;

  const stage =
    profile.mode === 'pregnancy' && profile.dueDate
      ? `Tydzień ${pregnancyWeek(profile.dueDate).week} · termin: ${formatPL(profile.dueDate)}`
      : profile.birthDate
      ? `${profile.childName ?? 'Dziecko'} · ${childAgeMonths(profile.birthDate)} mies. · ur. ${formatPL(profile.birthDate)}`
      : '—';

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { marginTop: spacing(1) }]}>👤 {t.profile.title}</Text>

        <Card>
          <Text style={type.h3}>{t.profile.role}: {profile.role === 'mother' ? t.profile.mother : t.profile.father}</Text>
          <Text style={[type.body, { marginTop: spacing(0.5) }]}>{t.profile.child}: {stage}</Text>
          <Text style={[type.small, { marginTop: spacing(0.5) }]}>
            {profile.experience === 'first' ? 'Pierwsze dziecko' : 'Kolejne dziecko (tryb doświadczonego rodzica)'}
          </Text>
        </Card>

        <Card>
          <CardRow label={t.profile.bigText}>
            <Switch accessibilityLabel={t.profile.bigText} value={largeText} onValueChange={setLargeText} trackColor={{ true: colors.primary }} />
          </CardRow>
          <Text style={type.small}>Statystyki: {events.length} wydarzeń · {notes.length} notatek · {moods.length} wpisów nastroju</Text>
        </Card>

        <CoupleSection />

        <Card>
          <Text style={type.small}>{t.profile.disclaimer}</Text>
        </Card>

        <PrimaryButton title={t.profile.export} onPress={() => Alert.alert('Eksport danych', exportJSON().slice(0, 1500) + (exportJSON().length > 1500 ? '\n…' : ''))} />
        <PrimaryButton
          title={t.profile.reset}
          secondary
          onPress={() =>
            Alert.alert(t.profile.reset, t.profile.resetConfirm, [
              { text: 'Anuluj', style: 'cancel' },
              { text: 'Usuń wszystko', style: 'destructive', onPress: resetAll },
            ])
          }
        />
      </ScrollView>
    </Screen>
  );
}

import { View } from 'react-native';

function CardRow({ label, children }: { label: string; children: React.ReactNode }) {
  const type = useType();
  return (
    <View style={{ marginBottom: spacing(1) }}>
      <Text style={[type.body, { marginBottom: spacing(0.5) }]}>{label}</Text>
      {children}
    </View>
  );
}
