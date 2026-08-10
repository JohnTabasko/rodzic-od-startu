import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, Text, TextInput, Pressable, View, Alert, StyleSheet } from 'react-native';
import { Screen, Card, PrimaryButton, Chip, useType } from '../components/UI';
import { community, CommunityGroup, CommunityPost, api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing } from '../theme/theme';

/** Społeczność (beta) — dokument §5.10: moderowane grupy, zero porad medycznych. */
export default function CommunityScreen() {
  const type = useType();
  const store = useAppStore();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ensureToken = useCallback(async (): Promise<string> => {
    if (store.authToken) return store.authToken;
    const a = await api.anonAuth(store.profile?.role ?? 'other');
    store.setPairInfo({ authToken: a.token, userId: a.userId });
    return a.token;
  }, [store.authToken]);

  const load = useCallback(async (groupId?: string) => {
    try {
      const token = await ensureToken();
      const g = await community.groups(token);
      setGroups(g.groups);
      const gid = groupId ?? active ?? g.groups[0]?.id ?? null;
      setActive(gid);
      if (gid) {
        const p = await community.posts(token, gid);
        setPosts(p.posts);
      }
      setError(null);
    } catch { setError('Brak połączenia z serwerem społeczności.'); }
  }, [active, ensureToken]);

  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!text.trim() || !active) return;
    try {
      const token = await ensureToken();
      const r = await community.addPost(token, active, text.trim());
      if (r.notice) Alert.alert('Do zespołu moderacji', r.notice);
      setText('');
      load(active);
    } catch { Alert.alert('Nie wysłano', 'Spróbuj ponownie później.'); }
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { marginTop: spacing(1) }]}>👥 Społeczność</Text>
        <Card style={{ backgroundColor: colors.surfaceAlt }}>
          <Text style={type.small}>
            Zasady: dzielimy się doświadczeniami, nie diagnozami. Porady medyczne są automatycznie
            kierowane do zespołu — rzetelną wiedzę znajdziesz w zakładce 📖 Wiedza. Możesz całkowicie
            wyłączyć społeczność (sekcja nie synchronizuje Twoich danych prywatnych).
          </Text>
        </Card>

        {error && <Card><Text style={[type.body, { color: colors.danger }]}>{error}</Text></Card>}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(1) }}>
          {groups.map(g => <Chip key={g.id} label={g.name} selected={active === g.id} onPress={() => load(g.id)} />)}
        </View>

        {posts.map(p => (
          <Card key={p.id}>
            <Text style={type.body}>{p.text}</Text>
            <Text style={[type.small, { marginTop: 4 }]}>
              {p.authorRole === 'mother' ? '👩' : p.authorRole === 'father' ? '👨' : '🧑'} rodzic {p.authorIdHash} · {p.createdAt.slice(0, 10)}
            </Text>
          </Card>
        ))}
        {posts.length === 0 && !error && <Text style={[type.body, { marginTop: spacing(2) }]}>Bądź pierwszą osobą, która coś napisze w tej grupie. 🌱</Text>}

        <Card style={{ marginTop: spacing(2) }}>
          <TextInput accessibilityLabel="Napisz do grupy" style={styles.input}
            placeholder="Twoje doświadczenie (bez porad medycznych)…" placeholderTextColor={colors.textMuted}
            multiline value={text} onChangeText={setText} />
          <PrimaryButton title="Opublikuj" disabled={text.trim().length < 3} onPress={send} />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing(1.5), minHeight: 70, backgroundColor: colors.bg, color: colors.text, fontSize: 16, textAlignVertical: 'top' },
});
