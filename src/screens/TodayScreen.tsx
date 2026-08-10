import { useNavigation } from '@react-navigation/native';
import type { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppNavigationProp } from '../navigation/types';
import {
  Card,
  HeroCard,
  IconButton,
  Kicker,
  SectionTitle,
  Screen,
  useType,
} from '../components/UI';
import { useAppStore } from '../store/useAppStore';
import { getMonthCard, getWeekCard, emergencyNotice } from '../data/content';
import { childAgeMonths, formatPL, pregnancyWeek, todayISO } from '../utils/dates';
import { colors, radius, shadows, spacing } from '../theme/theme';
import { t } from '../i18n/pl';

const MOODS: { emoji: string; label: string; score: 1 | 2 | 3 | 4 | 5 }[] = [
  { emoji: '😞', label: 'Trudno', score: 1 },
  { emoji: '😕', label: 'Smutek', score: 2 },
  { emoji: '😐', label: 'Nijako', score: 3 },
  { emoji: '🙂', label: 'Dobrze', score: 4 },
  { emoji: '😊', label: 'Radość', score: 5 },
];

type RowIconTone = 'terra' | 'sage' | 'blue' | 'gold';

export default function TodayScreen() {
  const type = useType();
  const nav = useNavigation<AppNavigationProp>();
  const profile = useAppStore((state) => state.profile);
  const events = useAppStore((state) => state.events);
  const addMood = useAppStore((state) => state.addMood);
  const moods = useAppStore((state) => state.moods);

  if (!profile) return null;
  const isMother = profile.role === 'mother';
  const accent = isMother ? colors.primary : colors.blueDeep;
  const today = todayISO();
  const dateLabel = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
  const todayMood = moods.find((mood) => mood.date === today);

  let headline = '';
  let body = '';
  let tips: string[] = [];
  let stageLabel = '';
  if (profile.mode === 'pregnancy' && profile.dueDate) {
    const { week, daysLeft } = pregnancyWeek(profile.dueDate);
    const card = getWeekCard(week);
    const content = isMother ? card.mother : card.father;
    stageLabel = `Tydzień ${week} z 40`;
    headline = content.title;
    body = `${content.summary}\n\nDo porodu ok. ${daysLeft} dni.`;
    tips = content.tips;
  } else if (profile.birthDate) {
    const months = childAgeMonths(profile.birthDate);
    const card = getMonthCard(months);
    stageLabel = `Miesiąc ${months} z 36`;
    headline = `${profile.childName ?? 'Maluszek'} — ${card.title}`;
    body = card.development;
    tips = [card.play];
  }

  const upcoming = [...events]
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={type.h1}>
              {isMother ? t.today.helloMother : t.today.helloFather}
            </Text>
            <Text style={type.small}>
              {stageLabel} · {dateLabel}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton label="Powiadomienia" onPress={() => undefined}>
              <MaterialCommunityIcons name="bell-outline" size={21} color={colors.text} />
            </IconButton>
            <IconButton label="Ustawienia trybu pary" onPress={() => nav.navigate('Profile')}>
              <MaterialCommunityIcons name="tune-variant" size={21} color={colors.text} />
            </IconButton>
          </View>
        </View>

        <HeroCard>
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={[type.kicker, styles.heroKicker]}>Wasza podróż</Text>
              <Text style={[type.h2, styles.heroTitle]}>{stageLabel}</Text>
              <Text style={[type.body, styles.heroText]}>{headline}</Text>
              <View style={styles.heroProgressTrack}>
                <View
                  style={[
                    styles.heroProgress,
                    { width: profile.mode === 'pregnancy' ? '60%' : '28%' },
                  ]}
                />
              </View>
            </View>
            <View style={styles.heroIllustration}>
              <MaterialCommunityIcons
                name={profile.mode === 'pregnancy' ? 'baby-face-outline' : 'baby-carriage'}
                size={54}
                color="#FFFFFF"
              />
              <View style={styles.heroDot} />
            </View>
          </View>
          <Text style={[type.small, styles.heroSummary]}>{body}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => nav.navigate('Knowledge')}
            style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
          >
            <Text style={styles.heroButtonText}>Zobacz, co dzieje się teraz</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={colors.primary} />
          </Pressable>
        </HeroCard>

        <Card>
          <View style={styles.cardHeading}>
            <Kicker>Dziś dla Ciebie</Kicker>
            <View
              style={[
                styles.roleChip,
                { backgroundColor: isMother ? colors.primarySoft : colors.blueSoft },
              ]}
            >
              <Text style={[type.small, { color: accent, fontWeight: '800' }]}>
                {isMother ? 'Dla mamy' : 'Mikroakcja dla taty'}
              </Text>
            </View>
          </View>
          {tips.slice(0, 3).map((tip, index) => (
            <Pressable key={tip} style={styles.listRow} onPress={() => nav.navigate('Knowledge')}>
              <RowIcon
                tone={index === 0 ? 'terra' : index === 1 ? 'sage' : 'gold'}
                icon={
                  index === 0
                    ? 'book-open-page-variant-outline'
                    : index === 1
                      ? 'heart-outline'
                      : 'star-outline'
                }
              />
              <View style={styles.listCopy}>
                <Text style={type.h3}>{tip}</Text>
                <Text style={type.small}>
                  {index === 0 ? 'Mały krok na dziś' : 'Wskazówka Gniazdka'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textFaint} />
            </Pressable>
          ))}
        </Card>

        <Card>
          <View style={styles.cardHeading}>
            <Kicker>Jak się dziś czujesz?</Kicker>
            <MaterialCommunityIcons name="heart-outline" size={20} color={colors.primaryLight} />
          </View>
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => {
              const selected = todayMood?.score === mood.score;
              return (
                <Pressable
                  key={mood.score}
                  accessibilityRole="button"
                  accessibilityLabel={`Nastrój: ${mood.label}`}
                  onPress={() => addMood(mood.score)}
                  style={[styles.mood, selected && styles.moodSelected]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[type.small, selected && { color: colors.goldDeep, fontWeight: '800' }]}
                  >
                    {mood.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <SectionTitle>{t.today.upcoming}</SectionTitle>
        {upcoming.length === 0 && <Text style={type.body}>Brak zaplanowanych wydarzeń.</Text>}
        {upcoming.map((event) => (
          <Pressable
            key={event.id}
            onPress={() => nav.navigate('Calendar')}
            style={styles.eventRow}
          >
            <RowIcon tone="blue" icon="calendar-month-outline" />
            <View style={styles.listCopy}>
              <Text style={type.h3}>{event.title}</Text>
              <Text style={type.small}>{formatPL(event.date)}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textFaint} />
          </Pressable>
        ))}

        <Card style={styles.emergencyCard}>
          <View style={styles.emergencyIcon}>
            <MaterialCommunityIcons name="shield-alert-outline" size={19} color={colors.goldDeep} />
          </View>
          <Text style={[type.small, styles.emergencyText]}>{emergencyNotice}</Text>
        </Card>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Otwórz asystentkę rodzica"
        onPress={() => nav.navigate('Assistant')}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="chat-processing-outline" size={27} color="#FFFFFF" />
        <View style={styles.fabBadge}>
          <Text style={styles.fabBadgeText}>?</Text>
        </View>
      </Pressable>
    </Screen>
  );
}

function RowIcon({
  tone,
  icon,
}: {
  tone: RowIconTone;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
}) {
  const palette = {
    terra: { backgroundColor: colors.primarySoft, color: colors.primary },
    sage: { backgroundColor: colors.sageSoft, color: colors.sageDeep },
    blue: { backgroundColor: colors.blueSoft, color: colors.blueDeep },
    gold: { backgroundColor: colors.goldSoft, color: colors.goldDeep },
  }[tone];
  return (
    <View style={[styles.rowIcon, { backgroundColor: palette.backgroundColor }]}>
      <MaterialCommunityIcons name={icon} size={21} color={palette.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing(1), paddingBottom: spacing(4) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(1.5),
  },
  headerCopy: { flex: 1, paddingRight: spacing(1) },
  headerActions: { flexDirection: 'row', gap: spacing(1) },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  heroCopy: { flex: 1 },
  heroKicker: { color: '#FBD9CC' },
  heroTitle: { color: '#FFFFFF', marginTop: 4 },
  heroText: { color: '#FBE7DC', marginTop: 2 },
  heroSummary: { color: '#FBE7DC', marginTop: spacing(1) },
  heroIllustration: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    bottom: 15,
    right: 17,
  },
  heroProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,.28)',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: spacing(1.5),
    width: 150,
  },
  heroProgress: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 99 },
  heroButton: {
    marginTop: spacing(1.5),
    minHeight: 46,
    borderRadius: radius.control,
    paddingHorizontal: spacing(1.5),
    backgroundColor: 'rgba(255,255,255,.92)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  heroButtonText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(0.5),
  },
  roleChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingVertical: spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F1E8DC',
  },
  listCopy: { flex: 1 },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodGrid: { flexDirection: 'row', gap: 7, marginTop: spacing(1) },
  mood: {
    flex: 1,
    minHeight: 62,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  moodSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
    transform: [{ scale: 1.04 }],
  },
  moodEmoji: { fontSize: 24 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.control,
    padding: spacing(1.5),
    marginBottom: spacing(1),
    ...shadows.card,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(1),
    backgroundColor: colors.goldSoft,
    borderColor: '#EBD9AC',
    marginTop: spacing(1),
  },
  emergencyIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyText: { flex: 1, color: '#7A5A1F' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.pop,
  },
  fabBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  fabBadgeText: { color: '#5C430F', fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
