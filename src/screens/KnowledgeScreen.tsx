import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Screen, Card, SectionTitle, useType } from '../components/UI';
import { useAppStore } from '../store/useAppStore';
import { scheduleAutoSync } from '../services/sync';
import { weekCards, monthCards, hospitalBag, mentalHealthNotice } from '../data/content';
import { pregnancyWeek, childAgeMonths } from '../utils/dates';
import { t } from '../i18n/pl';
import { colors, spacing } from '../theme/theme';

export default function KnowledgeScreen() {
  const type = useType();
  const { profile, checklistDone, toggleChecklist } = useAppStore();
  const [q, setQ] = useState('');
  const isMother = profile?.role !== 'father';
  const nav = useNavigation();

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = profile?.mode === 'pregnancy'
      ? weekCards.map(c => ({
          key: `w${c.week}`,
          title: `Tydzień ${c.week}: ${isMother ? c.mother.title : c.father.title}`,
          body: isMother ? c.mother.summary : c.father.summary,
        }))
      : monthCards.map(c => ({
          key: `m${c.month}`,
          title: c.title,
          body: `${c.development}\n🎨 Zabawa: ${c.play}`,
        }));
    return query ? list.filter(i => (i.title + i.body).toLowerCase().includes(query)) : list;
  }, [q, profile, isMother]);

  const doneCount = hospitalBag.filter((_, i) => checklistDone[`bag-${i}`]).length;

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { marginTop: spacing(1) }]}>{t.knowledge.title}</Text>
        <Text style={[type.small, { marginBottom: spacing(1) }]}>Treści weryfikowane przez zespół specjalistów · aktualizacja: {new Date().toLocaleDateString('pl-PL')}</Text>

        <Pressable accessibilityRole="button" accessibilityLabel="Otwórz bibliotekę wideo"
          onPress={() => nav.navigate('VideoLibrary' as never)}
          style={{ marginVertical: 8, borderRadius: 12, backgroundColor: '#2E7D6E', minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>🎬 Biblioteka wideo — ćwiczenia, oddech, pielęgnacja</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Otwórz społeczność"
          onPress={() => nav.navigate('Community' as never)}
          style={{ marginBottom: 8, borderRadius: 12, borderWidth: 2, borderColor: '#2E7D6E', minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 }}>
          <Text style={{ color: '#2E7D6E', fontSize: 17, fontWeight: '600' }}>👥 Społeczność rodziców (beta)</Text>
        </Pressable>

        <TextInput
          accessibilityLabel={t.knowledge.search}
          style={styles.search}
          placeholder={t.knowledge.search}
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
        />

        {profile?.mode === 'pregnancy' && (
          <>
            <SectionTitle>{t.knowledge.weekByWeek}</SectionTitle>
            {items.map(i => (
              <Card key={i.key}>
                <Text style={type.h3}>{i.title}</Text>
                <Text style={[type.body, { marginTop: spacing(0.5) }]}>{i.body}</Text>
              </Card>
            ))}
          </>
        )}
        {profile?.mode !== 'pregnancy' && items.map(i => (
          <Card key={i.key}>
            <Text style={type.h3}>{i.title}</Text>
            <Text style={[type.body, { marginTop: spacing(0.5) }]}>{i.body}</Text>
          </Card>
        ))}

        <SectionTitle>{t.knowledge.checklist} ({doneCount}/{hospitalBag.length})</SectionTitle>
        <Card>
          {hospitalBag.map((item, i) => {
            const done = !!checklistDone[`bag-${i}`];
            return (
              <Pressable key={i} accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={() => { toggleChecklist(`bag-${i}`); scheduleAutoSync(); }} style={styles.checkRow}>
                <Text style={{ fontSize: 22 }}>{done ? '✅' : '⬜'}</Text>
                <Text style={[type.body, { flex: 1, marginLeft: spacing(1), textDecorationLine: done ? 'line-through' : 'none', opacity: done ? 0.6 : 1 }]}>{item}</Text>
              </Pressable>
            );
          })}
        </Card>

        <Card style={{ backgroundColor: colors.surfaceAlt }}>
          <Text style={type.small}>{mentalHealthNotice}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing(1.5), minHeight: 48, backgroundColor: colors.surface, color: colors.text, fontSize: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 4 },
});
