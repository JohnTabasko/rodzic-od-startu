import React, { useEffect, useState } from 'react';
import { Text, TextInput, View, Alert, StyleSheet } from 'react-native';
import { Card, PrimaryButton, useType } from '../components/UI';
import { useAppStore } from '../store/useAppStore';
import { api, SharedEvent, serverHealth } from '../services/api';
import { autoSync as autoSyncService } from '../services/sync';
import { colors, spacing } from '../theme/theme';

/**
 * Tryb pary (dokument §5.7): łączenie kont kodem 6-znakowym,
 * wspólny kalendarz i checklisty; rozparowanie w każdej chwili.
 */
export default function CoupleSection() {
  const type = useType();
  const store = useAppStore();
  const { profile, authToken, coupleId, partnerRole, pairCode, events, checklistDone } = store;
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  // Health-check API przy wejściu na ekran profilu
  useEffect(() => {
    serverHealth().then(h => setServerOk(h.ok)).catch(() => setServerOk(false));
  }, []);

  const handle = async (fn: () => Promise<void>) => {
    setBusy(true); setStatus(null);
    try { await fn(); } catch (e: any) {
      Alert.alert('Połączenie nieudane', `Sprawdź, czy backend działa i adres API_URL jest poprawny.\n(${String(e?.message ?? e)})`);
    } finally { setBusy(false); }
  };

  const ensureAuth = async (): Promise<string> => {
    if (authToken) return authToken;
    const a = await api.anonAuth(profile?.role ?? 'other');
    store.setPairInfo({ authToken: a.token, userId: a.userId });
    return a.token;
  };

  const createPair = () => handle(async () => {
    const token = await ensureAuth();
    const p = await api.pairCreate(token);
    store.setPairInfo({ coupleId: p.coupleId, pairCode: p.code });
    setStatus('Sparowano! Przekaż kod partnerowi.');
  });

  const joinPair = () => handle(async () => {
    const token = await ensureAuth();
    const p = await api.pairJoin(token, code.trim());
    const s = await api.pairStatus(token);
    store.setPairInfo({ coupleId: p.coupleId, partnerRole: (s.partnerRole as any) ?? null });
    setStatus('Konta połączone! Możesz synchronizować.');
  });

  const syncAll = () => handle(async () => {
    await ensureAuth();
    await autoSyncService();
    setStatus('Zsynchronizowano ✔ — wspólny kalendarz i checklisty są aktualne.');
  });

  const leave = () => handle(async () => {
    const token = await ensureAuth().catch(() => authToken ?? '');
    if (token) await api.pairLeave(token).catch(() => undefined);
    store.setPairInfo({ coupleId: null, partnerRole: null, pairCode: null });
    setStatus('Rozparowano.');
  });

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text accessibilityRole="header" style={type.h3}>💑 Tryb pary</Text>
        {serverOk !== null && (
          <Text accessibilityLabel={serverOk ? 'Serwer API połączony' : 'Serwer API niedostępny'} style={{ marginLeft: 8, fontSize: 14 }}>
            {serverOk ? '🟢' : '🔴'}
          </Text>
        )}
      </View>
      {!coupleId ? (
        <View>
          <Text style={[type.small, { marginTop: spacing(0.5) }]}>
            Połącz konta z partnerem: jedno z Was tworzy kod, drugie wpisuje go u siebie.
          </Text>
          <PrimaryButton title={busy ? 'Łączenie…' : 'Utwórz kod dla partnera'} disabled={busy} onPress={createPair} />
          {pairCode && (
            <Text style={[type.h2, { textAlign: 'center', marginTop: spacing(1), letterSpacing: 6 }]}>{pairCode}</Text>
          )}
          <TextInput
            accessibilityLabel="Kod od partnera"
            style={styles.codeInput}
            placeholder="Wpisz kod od partnera"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
          />
          <PrimaryButton title="Połącz kodem" secondary disabled={busy || code.trim().length < 4} onPress={joinPair} />
        </View>
      ) : (
        <View>
          <Text style={[type.body, { marginTop: spacing(0.5) }]}>
            Połączone konto {partnerRole === 'mother' ? '👩 mamy' : partnerRole === 'father' ? '👨 taty' : 'partnera'}
            {pairCode ? ` · kod: ${pairCode}` : ''}
          </Text>
          <Text style={[type.small, { marginTop: spacing(0.5) }]}>Wspólne: kalendarz i checklisty. Notatki i nastrój pozostają prywatne.</Text>
          <PrimaryButton title={busy ? 'Synchronizuję…' : '🔄 Synchronizuj teraz'} disabled={busy} onPress={syncAll} />
          <PrimaryButton title="Rozłącz konta" secondary onPress={() =>
            Alert.alert('Rozłączyć konta?', 'Wspólne dane przestaną się synchronizować.', [
              { text: 'Anuluj', style: 'cancel' },
              { text: 'Rozłącz', style: 'destructive', onPress: leave },
            ])} />
        </View>
      )}
      {status && <Text style={[type.small, { marginTop: spacing(1), color: colors.success }]}>{status}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  codeInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing(1.5), minHeight: 52, marginTop: spacing(2), backgroundColor: colors.bg, color: colors.text, fontSize: 18, textAlign: 'center', letterSpacing: 4 },
});
