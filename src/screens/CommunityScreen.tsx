import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Chip, PrimaryButton, Screen, useType } from '../components/UI';
import { community, CommunityGroup, CommunityPost, api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing } from '../theme/theme';

/** Moderated community beta. Users share experiences, not medical advice. */
export default function CommunityScreen() {
  const type = useType();
  const profile = useAppStore((state) => state.profile);
  const authToken = useAppStore((state) => state.authToken);
  const setPairInfo = useAppStore((state) => state.setPairInfo);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ensureToken = useCallback(async (): Promise<string> => {
    if (authToken) return authToken;
    const auth = await api.anonAuth(profile?.role ?? 'other');
    setPairInfo({ authToken: auth.token, userId: auth.userId });
    return auth.token;
  }, [authToken, profile?.role, setPairInfo]);

  const load = useCallback(
    async (requestedGroup?: string) => {
      try {
        const token = await ensureToken();
        const groupResponse = await community.groups(token);
        setGroups(groupResponse.groups);
        const groupId = requestedGroup ?? activeGroup ?? groupResponse.groups[0]?.id ?? null;
        setActiveGroup(groupId);
        if (groupId) {
          const postResponse = await community.posts(token, groupId);
          setPosts(postResponse.posts);
        } else {
          setPosts([]);
        }
        setError(null);
      } catch {
        setError('Brak połączenia z serwerem społeczności.');
      }
    },
    [activeGroup, ensureToken],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!text.trim() || !activeGroup) return;
    try {
      const token = await ensureToken();
      const response = await community.addPost(token, activeGroup, text.trim());
      if (response.notice) Alert.alert('Do zespołu moderacji', response.notice);
      setText('');
      await load(activeGroup);
    } catch {
      Alert.alert('Nie wysłano', 'Spróbuj ponownie później.');
    }
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[type.h1, { marginTop: spacing(1) }]}>
          👥 Społeczność
        </Text>
        <Card style={{ backgroundColor: colors.surfaceAlt }}>
          <Text style={type.small}>
            Dzielimy się doświadczeniami, nie diagnozami. Porady medyczne są kierowane do moderacji.
            Prywatne dane aplikacji nie są publikowane w społeczności.
          </Text>
        </Card>

        {error && (
          <Card>
            <Text style={[type.body, { color: colors.danger }]}>{error}</Text>
          </Card>
        )}

        <View style={styles.groupList}>
          {groups.map((group) => (
            <Chip
              key={group.id}
              label={group.name}
              selected={activeGroup === group.id}
              onPress={() => void load(group.id)}
            />
          ))}
        </View>

        {posts.map((post) => (
          <Card key={post.id}>
            <Text style={type.body}>{post.text}</Text>
            <Text style={[type.small, { marginTop: 4 }]}>
              {post.authorRole === 'mother' ? '👩' : post.authorRole === 'father' ? '👨' : '🧑'}{' '}
              rodzic · {post.createdAt.slice(0, 10)}
            </Text>
          </Card>
        ))}
        {posts.length === 0 && !error && (
          <Text style={[type.body, { marginTop: spacing(2) }]}>
            Bądź pierwszą osobą w tej grupie. 🌱
          </Text>
        )}

        <Card style={{ marginTop: spacing(2) }}>
          <TextInput
            accessibilityLabel="Napisz do grupy"
            style={styles.input}
            placeholder="Twoje doświadczenie (bez porad medycznych)…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
            value={text}
            onChangeText={setText}
          />
          <PrimaryButton
            title="Opublikuj"
            disabled={text.trim().length < 3}
            onPress={() => void send()}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(1) },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: spacing(1.5),
    minHeight: 70,
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
