import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Card, PrimaryButton, Screen, useType } from '../components/UI';
import CoupleSection from './CoupleSection';
import { ApiError, api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { childAgeMonths, formatPL, pregnancyWeek } from '../utils/dates';
import { colors, spacing } from '../theme/theme';
import { t } from '../i18n/pl';

export default function ProfileScreen() {
  const type = useType();
  const profile = useAppStore((state) => state.profile);
  const authToken = useAppStore((state) => state.authToken);
  const largeText = useAppStore((state) => state.largeText);
  const setLargeText = useAppStore((state) => state.setLargeText);
  const exportJSON = useAppStore((state) => state.exportJSON);
  const resetAll = useAppStore((state) => state.resetAll);
  const eventsCount = useAppStore((state) => state.events.length);
  const notesCount = useAppStore((state) => state.notes.length);
  const moodsCount = useAppStore((state) => state.moods.length);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!profile) return null;

  const stage =
    profile.mode === 'pregnancy' && profile.dueDate
      ? `Tydzień ${pregnancyWeek(profile.dueDate).week} · termin: ${formatPL(profile.dueDate)}`
      : profile.birthDate
        ? `${profile.childName ?? 'Dziecko'} · ${childAgeMonths(profile.birthDate)} mies. · ur. ${formatPL(profile.birthDate)}`
        : '—';

  const handleExport = async () => {
    setExporting(true);
    const data = exportJSON();
    let fileUri: string | null = null;
    try {
      if (FileSystem.cacheDirectory && (await Sharing.isAvailableAsync())) {
        fileUri = `${FileSystem.cacheDirectory}rodzic-od-startu-${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(fileUri, data, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Eksport danych Rodzic od Startu',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Eksport danych', data.slice(0, 1500) + (data.length > 1500 ? '\n…' : ''));
      }
    } catch {
      Alert.alert('Eksport nieudany', 'Nie udało się przygotować pliku eksportu.');
    } finally {
      if (fileUri)
        await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => undefined);
      setExporting(false);
    }
  };

  const handleReset = async () => {
    setDeleting(true);
    try {
      if (authToken) await api.deleteAccount(authToken);
      resetAll();
    } catch (error) {
      const message = error instanceof ApiError ? error.code : 'Sprawdź połączenie z serwerem.';
      Alert.alert(
        'Nie udało się usunąć konta',
        `Dane lokalne nie zostały usunięte, aby zachować spójność z serwerem.\n(${message})`,
      );
    } finally {
      setDeleting(false);
    }
  };

  const busy = deleting || exporting;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[type.h1, { marginTop: spacing(1) }]}>
          👤 {t.profile.title}
        </Text>

        <Card>
          <Text style={type.h3}>
            {t.profile.role}: {profile.role === 'mother' ? t.profile.mother : t.profile.father}
          </Text>
          <Text style={[type.body, { marginTop: spacing(0.5) }]}>
            {t.profile.child}: {stage}
          </Text>
          <Text style={[type.small, { marginTop: spacing(0.5) }]}>
            {profile.experience === 'first'
              ? 'Pierwsze dziecko'
              : 'Kolejne dziecko (tryb doświadczonego rodzica)'}
          </Text>
        </Card>

        <Card>
          <CardRow label={t.profile.bigText}>
            <Switch
              accessibilityLabel={t.profile.bigText}
              value={largeText}
              onValueChange={setLargeText}
              trackColor={{ true: colors.primary }}
            />
          </CardRow>
          <Text style={type.small}>
            Statystyki: {eventsCount} wydarzeń · {notesCount} notatek · {moodsCount} wpisów nastroju
          </Text>
        </Card>

        <CoupleSection />

        <Card>
          <Text style={type.small}>{t.profile.disclaimer}</Text>
        </Card>

        <PrimaryButton
          title={exporting ? 'Przygotowywanie…' : t.profile.export}
          disabled={busy}
          onPress={() => void handleExport()}
        />
        <PrimaryButton
          title={deleting ? 'Usuwanie…' : t.profile.reset}
          secondary
          disabled={busy}
          onPress={() =>
            Alert.alert(t.profile.reset, t.profile.resetConfirm, [
              { text: 'Anuluj', style: 'cancel' },
              { text: 'Usuń wszystko', style: 'destructive', onPress: () => void handleReset() },
            ])
          }
        />
      </ScrollView>
    </Screen>
  );
}

function CardRow({ label, children }: { label: string; children: ReactNode }) {
  const type = useType();
  return (
    <View style={{ marginBottom: spacing(1) }}>
      <Text style={[type.body, { marginBottom: spacing(0.5) }]}>{label}</Text>
      {children}
    </View>
  );
}
