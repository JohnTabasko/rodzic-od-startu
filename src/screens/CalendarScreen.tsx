import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Screen, Card, PrimaryButton, useType } from '../components/UI';
import { useAppStore } from '../store/useAppStore';
import { scheduleAutoSync } from '../services/sync';
import { isValidISODate, formatPL, todayISO } from '../utils/dates';
import { t } from '../i18n/pl';
import { colors, spacing } from '../theme/theme';

const EMOJI: Record<string, string> = {
  badanie: '🧪',
  wizyta: '🩺',
  szczepienie: '💉',
  'kamień milowy': '⭐',
};

export default function CalendarScreen() {
  const type = useType();
  const { events, addEvent, removeEvent } = useAppStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const canAdd = title.trim().length > 0 && isValidISODate(date);

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { marginTop: spacing(1) }]}>📅 {t.tabs.calendar}</Text>

        <Card style={{ marginTop: spacing(1) }}>
          <Text style={type.h3}>{t.calendar.add}</Text>
          <TextInput
            accessibilityLabel={t.calendar.title}
            style={styles.input}
            placeholder={t.calendar.title}
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={240}
          />
          <TextInput
            accessibilityLabel={t.calendar.date}
            style={[styles.input, { marginTop: spacing(1) }]}
            placeholder="2026-08-15"
            placeholderTextColor={colors.textMuted}
            value={date}
            onChangeText={setDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <PrimaryButton
            title={t.calendar.add}
            disabled={!canAdd}
            onPress={() => {
              addEvent({ title: title.trim(), date });
              setTitle('');
              setDate('');
              scheduleAutoSync();
            }}
          />
          <Text style={[type.small, { marginTop: spacing(1) }]}>
            Synchronizacja z Google/Apple Calendar — w Fazie 2.
          </Text>
        </Card>

        {sorted.length === 0 && (
          <Text style={[type.body, { marginTop: spacing(2) }]}>{t.calendar.empty}</Text>
        )}
        {sorted.map((e) => (
          <Card key={e.id} style={e.date < todayISO() ? { opacity: 0.55 } : undefined}>
            <Text style={type.h3}>
              {EMOJI[e.type ?? ''] ?? '📌'} {e.title}
            </Text>
            <Text style={[type.small, { marginTop: 4 }]}>{formatPL(e.date)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Usuń ${e.title}`}
              onPress={() =>
                Alert.alert('Usunąć wydarzenie?', e.title, [
                  { text: 'Anuluj', style: 'cancel' },
                  {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: () => {
                      removeEvent(e.id);
                      scheduleAutoSync();
                    },
                  },
                ])
              }
              hitSlop={8}
            >
              <Text style={[type.small, { color: colors.danger, marginTop: 6 }]}>Usuń</Text>
            </Pressable>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: spacing(1.5),
    minHeight: 48,
    marginTop: spacing(1),
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: 16,
  },
});
