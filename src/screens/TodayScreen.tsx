import { ScrollView, Text, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { Screen, Card, SectionTitle, useType } from '../components/UI';
import { useAppStore } from '../store/useAppStore';
import { getWeekCard, getMonthCard, emergencyNotice } from '../data/content';
import { pregnancyWeek, childAgeMonths, todayISO, formatPL } from '../utils/dates';
import { t } from '../i18n/pl';
import { colors, spacing } from '../theme/theme';

const MOODS: { emoji: string; score: 1 | 2 | 3 | 4 | 5 }[] = [
  { emoji: '😞', score: 1 },
  { emoji: '😕', score: 2 },
  { emoji: '😐', score: 3 },
  { emoji: '🙂', score: 4 },
  { emoji: '😄', score: 5 },
];

export default function TodayScreen() {
  const type = useType();
  const nav = useNavigation<NavigationProp<RootStackParamList>>();
  const { profile, events, addMood, moods } = useAppStore();
  if (!profile) return null;
  const isMother = profile.role === 'mother';
  const accent = isMother ? colors.primary : colors.accent;

  const today = todayISO();
  const todayMood = moods.find((m) => m.date === today);

  let headline = '',
    body = '',
    tips: string[] = [];
  if (profile.mode === 'pregnancy' && profile.dueDate) {
    const { week, daysLeft } = pregnancyWeek(profile.dueDate);
    const card = getWeekCard(week);
    const content = isMother ? card.mother : card.father;
    headline = `${t.today.week} ${week} — ${content.title}`;
    body = `${content.summary}\n\nDo porodu ok. ${daysLeft} dni.`;
    tips = content.tips;
  } else if (profile.birthDate) {
    const months = childAgeMonths(profile.birthDate);
    const card = getMonthCard(months);
    headline = `${profile.childName ?? 'Maluszek'} — ${months} ${t.today.month}.`;
    body = `${card.title}: ${card.development}`;
    tips = [card.play];
  }

  const upcoming = [...events]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[type.h1, { marginTop: spacing(1) }]}>
          {isMother ? t.today.helloMother : t.today.helloFather}
        </Text>

        <Card style={{ borderLeftWidth: 4, borderLeftColor: accent }}>
          <Text style={type.h3}>{headline}</Text>
          <Text style={[type.body, { marginTop: spacing(0.5) }]}>{body}</Text>
        </Card>

        <Card>
          <Text style={type.h3}>{isMother ? t.today.todayForYou : t.today.microAction}</Text>
          {tips.map((tip, i) => (
            <Text key={i} style={[type.body, { marginTop: spacing(0.5) }]}>
              • {tip}
            </Text>
          ))}
        </Card>

        <Card>
          <Text style={type.h3}>{t.today.howDoYouFeel}</Text>
          <View style={{ flexDirection: 'row', marginTop: spacing(1) }}>
            {MOODS.map((m) => (
              <Pressable
                key={m.score}
                accessibilityRole="button"
                accessibilityLabel={`Nastrój ${m.score} na 5`}
                onPress={() => addMood(m.score)}
                style={{
                  marginRight: spacing(1.5),
                  padding: 6,
                  borderRadius: 10,
                  backgroundColor: todayMood?.score === m.score ? colors.surfaceAlt : 'transparent',
                }}
              >
                <Text style={{ fontSize: 30 }}>{m.emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <SectionTitle>{t.today.upcoming}</SectionTitle>
        {upcoming.length === 0 && <Text style={type.body}>—</Text>}
        {upcoming.map((e) => (
          <Card key={e.id}>
            <Text style={type.h3}>{e.title}</Text>
            <Text style={[type.small, { marginTop: 4 }]}>📅 {formatPL(e.date)}</Text>
          </Card>
        ))}

        <Card style={{ backgroundColor: colors.surfaceAlt }}>
          <Text style={type.small}>{emergencyNotice}</Text>
        </Card>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Otwórz asystenta rodzica"
        onPress={() => nav.navigate('Assistant')}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 24,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 28 }}>💬</Text>
      </Pressable>
    </Screen>
  );
}
