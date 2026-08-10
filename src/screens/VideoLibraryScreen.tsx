import React, { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable, View, Alert, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Screen, Card, SectionTitle, Chip, useType } from '../components/UI';
import { VIDEOS, CATEGORIES, VideoItem } from '../data/videos';
import { colors, spacing, MIN_TOUCH } from '../theme/theme';

const DIR = FileSystem.documentDirectory + 'videos/';

/** Biblioteka wideo (dokument §5.8): streaming + pobieranie offline, treści wg roli. */
export default function VideoLibraryScreen() {
  const type = useType();
  const [cat, setCat] = useState<VideoItem['category'] | 'all'>('all');
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const [downloaded, setDownloaded] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(DIR);
        if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
        const files = await FileSystem.readDirectoryAsync(DIR);
        const map: Record<string, string> = {};
        files.forEach(f => { map[f.replace('.mp4', '')] = DIR + f; });
        setDownloaded(map);
      } catch { /* brak FS (web) — sama transmisja */ }
    })();
  }, []);

  const toggleDownload = async (v: VideoItem) => {
    if (downloaded[v.id]) {
      await FileSystem.deleteAsync(downloaded[v.id], { idempotent: true }).catch(() => undefined);
      setDownloaded(({ [v.id]: _drop, ...rest }) => rest);
      return;
    }
    setBusy(v.id);
    try {
      const res = await FileSystem.downloadAsync(v.streamUri, DIR + v.id + '.mp4');
      setDownloaded(d => ({ ...d, [v.id]: res.uri }));
    } catch {
      Alert.alert('Pobieranie nieudane', 'Sprawdź połączenie i spróbuj ponownie.');
    } finally { setBusy(null); }
  };

  const items = VIDEOS.filter(v => cat === 'all' || v.category === cat);
  const source = (v: VideoItem) => ({ uri: downloaded[v.id] ?? v.streamUri });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[type.h1, { marginTop: spacing(1) }]}>🎬 Biblioteka wideo</Text>
        <Text style={type.small}>Materiały z certyfikowanymi specjalistami · streaming i tryb offline</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(1) }}>
          <Chip label="Wszystkie" selected={cat === 'all'} onPress={() => setCat('all')} />
          {CATEGORIES.map(c => <Chip key={c.key} label={c.label} selected={cat === c.key} onPress={() => setCat(c.key)} />)}
        </View>

        {playing && (
          <Card>
            <Video
              source={source(playing)}
              style={styles.player}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              accessibilityLabel={`Odtwarzanie: ${playing.title}`}
            />
            <Pressable accessibilityRole="button" onPress={() => setPlaying(null)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
              <Text style={[type.small, { color: colors.primary }]}>Zamknij odtwarzacz ⤫</Text>
            </Pressable>
          </Card>
        )}

        <SectionTitle>{cat === 'all' ? 'Wszystkie materiały' : CATEGORIES.find(c => c.key === cat)?.label}</SectionTitle>
        {items.map(v => (
          <Card key={v.id}>
            <Text style={type.h3}>{v.title}</Text>
            <Text style={type.small}>🎓 {v.expert} · {v.minutes} min · recenzja: {v.reviewedAt}</Text>
            <Text style={type.small}>{v.forRoles.includes('father') && v.forRoles.includes('mother') ? 'Dla obojga' : v.forRoles.includes('father') ? '👨 Dla taty' : '👩 Dla mamy'}{downloaded[v.id] ? ' · 📥 offline' : ''}</Text>
            <View style={{ flexDirection: 'row', marginTop: spacing(1) }}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Odtwórz ${v.title}`} onPress={() => setPlaying(v)} style={[styles.btn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#fff', fontSize: 16 }}>▶ Odtwórz</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={downloaded[v.id] ? `Usuń z offline: ${v.title}` : `Pobierz offline: ${v.title}`}
                disabled={busy === v.id}
                onPress={() => toggleDownload(v)}
                style={[styles.btn, { borderWidth: 1.5, borderColor: colors.accent, marginLeft: spacing(1) }]}>
                <Text style={{ color: colors.accent, fontSize: 16 }}>
                  {busy === v.id ? '⏳…' : downloaded[v.id] ? '🗑 Usuń offline' : '⬇ Offline'}
                </Text>
              </Pressable>
            </View>
          </Card>
        ))}
        <Card style={{ backgroundColor: colors.surfaceAlt }}>
          <Text style={type.small}>Demo: strumienie testowe. W produkcji każdy materiał ma napisy i transkrypcję (WCAG 1.2.2) oraz datę recenzji specjalisty — jak w bibliotece tekstowej.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  player: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#000' },
  btn: { borderRadius: 10, paddingHorizontal: 14, minHeight: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' },
});
