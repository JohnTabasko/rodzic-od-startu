import { useEffect, useState } from 'react';
import { getTodaySteps, StepsInfo } from '../services/wearables';
import { ScrollView, Text, TextInput, Pressable, View, StyleSheet } from 'react-native';
import { Screen, Card, SectionTitle, PrimaryButton, Chip, useType } from '../components/UI';
import { useAppStore } from '../store/useAppStore';
import { todayISO } from '../utils/dates';
import { mentalHealthNotice } from '../data/content';
import { t } from '../i18n/pl';
import { colors, spacing } from '../theme/theme';

export default function JournalScreen() {
  const type = useType();
  const {
    profile,
    notes,
    addNote,
    moods,
    weights,
    addWeight,
    belly,
    addBelly,
    bps,
    addBp,
    kicks,
    addKick,
    resetKicksToday,
  } = useAppStore();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<'note' | 'question'>('note');
  const [weight, setWeight] = useState('');
  const [bellyCm, setBellyCm] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');

  const isPregnancy = profile?.mode === 'pregnancy';
  const recentMoods = [...moods].slice(-14);
  const kicksToday = kicks[todayISO()] ?? 0;
  const [steps, setSteps] = useState<StepsInfo | null | 'no-module'>(null);
  useEffect(() => {
    getTodaySteps().then((r) => setSteps(r ?? 'no-module'));
  }, []);

  const num = (s: string) => Number.parseFloat(s.replace(',', '.'));
  const valid = (value: string, min: number, max: number) => {
    const parsed = num(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max;
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { marginTop: spacing(1) }]}>📊 {t.tabs.journal}</Text>

        {isPregnancy && (
          <>
            <SectionTitle>Licznik ruchów dziecka</SectionTitle>
            <Card style={{ alignItems: 'center' }}>
              <Text style={type.body}>Dotknij przy każdym wyraźnym ruchu (sesja 2 h)</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Dolicz ruch. Dziś: ${kicksToday}`}
                onPress={addKick}
                onLongPress={resetKicksToday}
                style={styles.kickButton}
              >
                <Text style={{ fontSize: 40 }}>{kicksToday}</Text>
                <Text style={[type.small, { color: '#fff' }]}>ruchów dziś</Text>
              </Pressable>
              <Text style={[type.small, { textAlign: 'center' }]}>
                {kicksToday >= 10
                  ? '✅ Osiągnięto próg aplikacji (10+ ruchów). To nie zastępuje oceny medycznej.'
                  : 'Cel pomocniczy aplikacji: 10 ruchów w 2 godziny. Wyraźnie mniej lub nagła zmiana rytmu → kontakt z lekarzem.'}
              </Text>
              <Text style={[type.small, { marginTop: 4, opacity: 0.7 }]}>
                Przytrzymaj kółko, aby wyzerować.
              </Text>
            </Card>
          </>
        )}

        <SectionTitle>{t.journal.notes}</SectionTitle>
        <Card>
          <View style={{ flexDirection: 'row' }}>
            <Chip label="Notatka" selected={kind === 'note'} onPress={() => setKind('note')} />
            <Chip
              label={t.journal.questionForDoctor}
              selected={kind === 'question'}
              onPress={() => setKind('question')}
            />
          </View>
          <TextInput
            accessibilityLabel={t.journal.addNote}
            style={[styles.input, { minHeight: 80 }]}
            multiline
            placeholder={t.journal.addNote}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
          />
          <PrimaryButton
            title="Zapisz"
            disabled={!text.trim()}
            onPress={() => {
              addNote(text.trim(), kind);
              setText('');
            }}
          />
        </Card>
        {notes.length === 0 && <Text style={type.body}>{t.journal.noNotes}</Text>}
        {notes.map((n) => (
          <Card key={n.id}>
            <Text style={type.h3}>
              {n.kind === 'question' ? '❓' : '📝'} {n.text}
            </Text>
            <Text style={[type.small, { marginTop: 4 }]}>{n.date}</Text>
          </Card>
        ))}

        <SectionTitle>⌚ Aktywność</SectionTitle>
        <Card>
          <Text style={type.body}>
            {steps === null
              ? 'Pobieram dane o krokach…'
              : steps === 'no-module'
                ? 'Integracja z krokomierzem dostępna w pełnej wersji aplikacji (development build + zgoda na kroki).'
                : `Dziś: ${steps.steps.toLocaleString('pl-PL')} kroków (źródło: ${steps.source === 'health-connect' ? 'Health Connect' : 'HealthKit'})`}
          </Text>
        </Card>

        <SectionTitle>{t.journal.mood} (14 dni)</SectionTitle>
        <Card>
          {recentMoods.length === 0 && (
            <Text style={type.body}>Oceń nastrój w zakładce „Dziś”.</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', minHeight: 70 }}>
            {recentMoods.map((m, i) => (
              <View key={i} style={{ alignItems: 'center', marginRight: 8 }}>
                <View
                  style={{
                    width: 14,
                    height: m.score * 12,
                    backgroundColor: colors.primary,
                    borderRadius: 4,
                  }}
                />
                <Text style={{ fontSize: 9, color: colors.textMuted }}>{m.date.slice(5)}</Text>
              </View>
            ))}
          </View>
          <Text style={[type.small, { marginTop: spacing(1) }]}>{mentalHealthNotice}</Text>
        </Card>

        <SectionTitle>{t.journal.weight}</SectionTitle>
        <Card>
          <TextInput
            accessibilityLabel={t.journal.addWeight}
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder={t.journal.addWeight}
            placeholderTextColor={colors.textMuted}
            value={weight}
            onChangeText={setWeight}
          />
          <PrimaryButton
            title="Zapisz wagę"
            disabled={!valid(weight, 20, 300)}
            onPress={() => {
              addWeight(num(weight));
              setWeight('');
            }}
          />
          {weights.slice(0, 5).map((w, i) => (
            <Text key={i} style={[type.body, { marginTop: 6 }]}>
              {w.date} — {w.kg} kg
            </Text>
          ))}
        </Card>

        {isPregnancy && (
          <>
            <SectionTitle>Obwód brzucha</SectionTitle>
            <Card>
              <TextInput
                accessibilityLabel="Obwód brzucha w cm"
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="Dodaj obwód (cm)"
                placeholderTextColor={colors.textMuted}
                value={bellyCm}
                onChangeText={setBellyCm}
              />
              <PrimaryButton
                title="Zapisz obwód"
                disabled={!valid(bellyCm, 30, 250)}
                onPress={() => {
                  addBelly(num(bellyCm));
                  setBellyCm('');
                }}
              />
              {belly.slice(0, 5).map((b, i) => (
                <Text key={i} style={[type.body, { marginTop: 6 }]}>
                  {b.date} — {b.cm} cm
                </Text>
              ))}
            </Card>

            <SectionTitle>Ciśnienie krwi</SectionTitle>
            <Card>
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  accessibilityLabel="Ciśnienie skurczowe"
                  style={[styles.input, { flex: 1 }]}
                  keyboardType="number-pad"
                  placeholder="Skurczowe"
                  placeholderTextColor={colors.textMuted}
                  value={sys}
                  onChangeText={setSys}
                />
                <TextInput
                  accessibilityLabel="Ciśnienie rozkurczowe"
                  style={[styles.input, { flex: 1, marginLeft: spacing(1) }]}
                  keyboardType="number-pad"
                  placeholder="Rozkurczowe"
                  placeholderTextColor={colors.textMuted}
                  value={dia}
                  onChangeText={setDia}
                />
              </View>
              <PrimaryButton
                title="Zapisz ciśnienie"
                disabled={!valid(sys, 50, 300) || !valid(dia, 30, 200)}
                onPress={() => {
                  addBp(num(sys), num(dia));
                  setSys('');
                  setDia('');
                }}
              />
              {bps.slice(0, 5).map((b, i) => {
                const elevated = b.sys >= 140 || b.dia >= 90;
                return (
                  <Text
                    key={i}
                    style={[
                      type.body,
                      { marginTop: 6, color: elevated ? colors.danger : colors.text },
                    ]}
                  >
                    {b.date} — {b.sys}/{b.dia} mmHg{' '}
                    {elevated ? '⚠ wartość podwyższona — skonsultuj z lekarzem' : ''}
                  </Text>
                );
              })}
            </Card>
          </>
        )}
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
  kickButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primarySoft,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing(1.5),
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
});
