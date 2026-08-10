import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as FileSystem from 'expo-file-system/legacy';
import { Card, Chip, Screen, SectionTitle, useType } from '../components/UI';
import { CATEGORIES, VIDEOS, VideoItem } from '../data/videos';
import { useAppStore } from '../store/useAppStore';
import { colors, MIN_TOUCH, spacing } from '../theme/theme';

/** Streaming and offline video library. Production assets must come from a CMS/CDN. */
export default function VideoLibraryScreen() {
  const type = useType();
  const role = useAppStore((state) => state.profile?.role);
  const [category, setCategory] = useState<VideoItem['category'] | 'all'>('all');
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const [downloaded, setDownloaded] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const directory = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}videos/` : null;

  useEffect(() => {
    if (!directory) return;
    let mounted = true;
    void (async () => {
      try {
        const info = await FileSystem.getInfoAsync(directory);
        if (!info.exists) await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        const files = await FileSystem.readDirectoryAsync(directory);
        if (mounted) {
          setDownloaded(
            Object.fromEntries(
              files
                .filter((file) => file.endsWith('.mp4'))
                .map((file) => [file.slice(0, -4), `${directory}${file}`]),
            ),
          );
        }
      } catch {
        // Streaming remains available when the native file system is unavailable.
      }
    })();
    return () => {
      mounted = false;
    };
  }, [directory]);

  const toggleDownload = async (video: VideoItem) => {
    if (!directory) {
      Alert.alert('Tryb offline niedostępny', 'Pobieranie wymaga pełnej wersji aplikacji.');
      return;
    }
    if (downloaded[video.id]) {
      await FileSystem.deleteAsync(downloaded[video.id], { idempotent: true }).catch(
        () => undefined,
      );
      setDownloaded((current) => {
        const next = { ...current };
        delete next[video.id];
        return next;
      });
      return;
    }

    setBusy(video.id);
    try {
      const result = await FileSystem.downloadAsync(video.streamUri, `${directory}${video.id}.mp4`);
      setDownloaded((current) => ({ ...current, [video.id]: result.uri }));
    } catch {
      Alert.alert('Pobieranie nieudane', 'Sprawdź połączenie i spróbuj ponownie.');
    } finally {
      setBusy(null);
    }
  };

  const items = useMemo(
    () =>
      VIDEOS.filter(
        (video) =>
          (role ? video.forRoles.includes(role) : true) &&
          (category === 'all' || video.category === category),
      ),
    [category, role],
  );
  const playerSource = playing ? (downloaded[playing.id] ?? playing.streamUri) : null;
  const player = useVideoPlayer(playerSource, (instance) => {
    if (playerSource) instance.play();
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[type.h1, { marginTop: spacing(1) }]}>
          🎬 Biblioteka wideo
        </Text>
        <Text style={type.small}>Materiały dopasowane do roli · streaming i tryb offline</Text>

        <View style={styles.categories}>
          <Chip
            label="Wszystkie"
            selected={category === 'all'}
            onPress={() => setCategory('all')}
          />
          {CATEGORIES.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              selected={category === item.key}
              onPress={() => setCategory(item.key)}
            />
          ))}
        </View>

        {playing && (
          <Card>
            <VideoView
              player={player}
              style={styles.player}
              nativeControls
              contentFit="contain"
              accessibilityLabel={`Odtwarzanie: ${playing.title}`}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setPlaying(null)}
              style={styles.closeButton}
            >
              <Text style={[type.small, { color: colors.primary }]}>Zamknij odtwarzacz ⤫</Text>
            </Pressable>
          </Card>
        )}

        <SectionTitle>
          {category === 'all'
            ? 'Materiały dla Ciebie'
            : CATEGORIES.find((item) => item.key === category)?.label}
        </SectionTitle>
        {items.map((video) => (
          <Card key={video.id}>
            <Text style={type.h3}>{video.title}</Text>
            <Text style={type.small}>
              🎓 {video.expert} · {video.minutes} min · recenzja: {video.reviewedAt}
            </Text>
            <Text style={type.small}>
              {downloaded[video.id] ? '📥 dostępne offline' : 'Streaming'}
            </Text>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Odtwórz ${video.title}`}
                onPress={() => setPlaying(video)}
                style={[styles.button, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryButtonText}>▶ Odtwórz</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  downloaded[video.id]
                    ? `Usuń z offline: ${video.title}`
                    : `Pobierz offline: ${video.title}`
                }
                disabled={busy === video.id}
                onPress={() => void toggleDownload(video)}
                style={[styles.button, styles.downloadButton]}
              >
                <Text style={styles.downloadText}>
                  {busy === video.id ? '⏳…' : downloaded[video.id] ? '🗑 Usuń' : '⬇ Offline'}
                </Text>
              </Pressable>
            </View>
          </Card>
        ))}

        <Card style={{ backgroundColor: colors.surfaceAlt }}>
          <Text style={type.small}>
            Katalog demonstracyjny. Przed publikacją każdy materiał powinien mieć własny stream,
            napisy i transkrypcję (WCAG 1.2.2) oraz potwierdzoną recenzję specjalisty.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  categories: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(1) },
  player: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#000' },
  closeButton: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  actions: { flexDirection: 'row', marginTop: spacing(1) },
  button: {
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16 },
  downloadButton: { borderWidth: 1.5, borderColor: colors.accent, marginLeft: spacing(1) },
  downloadText: { color: colors.accent, fontSize: 16 },
});
