import { useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { ScrollView, Text, TextInput, Pressable, StyleSheet, View } from 'react-native';
import { Screen, Card, SectionTitle, useType } from '../components/UI';
import { useAppStore } from '../store/useAppStore';
import { scheduleAutoSync } from '../services/sync';
import { weekCards, monthCards, hospitalBag, mentalHealthNotice } from '../data/content';
import { t } from '../i18n/pl';
import { colors, spacing } from '../theme/theme';

export default function KnowledgeScreen() {
  const type = useType();
  const { profile, checklistDone, toggleChecklist } = useAppStore();
  const [q, setQ] = useState('');
  const isMother = profile?.role !== 'father';
  const nav = useNavigation<NavigationProp<RootStackParamList>>();

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list =
      profile?.mode === 'pregnancy'
        ? weekCards.map((c) => ({
            key: `w${c.week}`,
            title: `Tydzień ${c.week}: ${isMother ? c.mother.title : c.father.title}`,
            body: isMother ? c.mother.summary : c.father.summary,
          }))
        : monthCards.map((c) => ({
            key: `m${c.month}`,
            title: c.title,
            body: `${c.development}\n🎨 Zabawa: ${c.play}`,
          }));
    return query ? list.filter((i) => (i.title + i.body).toLowerCase().includes(query)) : list;
  }, [q, profile, isMother]);

  const doneCount = hospitalBag.filter((_, i) => checklistDone[`bag-${i}`]).length;

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { marginTop: spacing(1) }]}>{t.knowledge.title}</Text>
        <Text style={[type.small, { marginBottom: spacing(1) }]}>
          Treści edukacyjne w wersji demonstracyjnej — przed publikacją wymagają potwierdzenia przez
          zespół medyczny.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Otwórz bibliotekę wideo"
          onPress={() => nav.navigate('VideoLibrary')}
          style={{
            marginVertical: 8,
            borderRadius: 16,
            backgroundColor: colors.sageDeep,
            minHeight: 48,
            justifyContent: 'center',
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>
            🎬 Biblioteka wideo — ćwiczenia, oddech, pielęgnacja
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Otwórz społeczność"
          onPress={() => nav.navigate('Community')}
          style={{
            marginBottom: 8,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: colors.lavenderDeep,
            minHeight: 48,
            justifyContent: 'center',
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ color: colors.lavenderDeep, fontSize: 16, fontWeight: '800' }}>
            👥 Społeczność rodziców (beta)
          </Text>
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
            {items.map((i) => (
              <Card key={i.key}>
                <Text style={type.h3}>{i.title}</Text>
                <Text style={[type.body, { marginTop: spacing(0.5) }]}>{i.body}</Text>
              </Card>
            ))}
          </>
        )}
        {profile?.mode !== 'pregnancy' &&
          items.map((i) => (
            <Card key={i.key}>
              <Text style={type.h3}>{i.title}</Text>
              <Text style={[type.body, { marginTop: spacing(0.5) }]}>{i.body}</Text>
            </Card>
          ))}

        <SectionTitle>
          {t.knowledge.checklist} ({doneCount}/{hospitalBag.length})
        </SectionTitle>
        <Card>
          {hospitalBag.map((item, i) => {
            const done = !!checklistDone[`bag-${i}`];
            return (
              <Pressable
                key={i}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                onPress={() => {
                  toggleChecklist(`bag-${i}`);
                  scheduleAutoSync();
                }}
                style={styles.checkRow}
              >
                <View style={[styles.checkIcon, done && styles.checkIconDone]}>
                  <MaterialCommunityIcons
                    name={done ? 'check' : 'checkbox-blank-outline'}
                    size={18}
                    color={done ? '#FFFFFF' : colors.textFaint}
                  />
                </View>
                <Text
                  style={[
                    type.body,
                    {
                      flex: 1,
                      marginLeft: spacing(1),
                      textDecorationLine: done ? 'line-through' : 'none',
                      opacity: done ? 0.6 : 1,
                    },
                  ]}
                >
                  {item}
                </Text>
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
  search: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: spacing(1.5),
    minHeight: 48,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingVertical: 4 },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconDone: { backgroundColor: colors.sageDeep, borderColor: colors.sageDeep },
});
