import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, PrimaryButton, useType } from '../components/UI';
import { ApiError, api, serverHealth } from '../services/api';
import { autoSync } from '../services/sync';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing } from '../theme/theme';

/** Shared calendar and checklist pairing, with private health data kept local. */
export default function CoupleSection() {
  const type = useType();
  const profile = useAppStore((state) => state.profile);
  const authToken = useAppStore((state) => state.authToken);
  const coupleId = useAppStore((state) => state.coupleId);
  const pairMemberCount = useAppStore((state) => state.pairMemberCount);
  const partnerRole = useAppStore((state) => state.partnerRole);
  const pairCode = useAppStore((state) => state.pairCode);
  const setPairInfo = useAppStore((state) => state.setPairInfo);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  const waitingForPartner = Boolean(coupleId && pairMemberCount < 2);

  useEffect(() => {
    let mounted = true;
    serverHealth()
      .then((health) => mounted && setServerOk(health.ok))
      .catch(() => mounted && setServerOk(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authToken) return;
    let mounted = true;
    api
      .pairStatus(authToken)
      .then((pair) => {
        if (!mounted) return;
        setPairInfo({
          coupleId: pair.coupleId ?? null,
          pairCode: pair.code ?? null,
          pairMemberCount: pair.memberCount,
          partnerRole:
            pair.partnerRole === 'mother' || pair.partnerRole === 'father'
              ? pair.partnerRole
              : null,
        });
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [authToken, setPairInfo]);

  const handle = async (operation: () => Promise<void>) => {
    setBusy(true);
    setStatus(null);
    try {
      await operation();
    } catch (error) {
      const message = error instanceof ApiError ? error.code : 'Sprawdź połączenie z backendem.';
      Alert.alert('Operacja nieudana', message);
    } finally {
      setBusy(false);
    }
  };

  const ensureAuth = async (): Promise<string> => {
    if (authToken) return authToken;
    const auth = await api.anonAuth(profile?.role ?? 'other');
    setPairInfo({ authToken: auth.token, userId: auth.userId, pairMemberCount: 0 });
    return auth.token;
  };

  const createPair = () =>
    handle(async () => {
      const token = await ensureAuth();
      const pair = await api.pairCreate(token);
      setPairInfo({
        coupleId: pair.coupleId,
        pairCode: pair.code,
        pairMemberCount: pair.memberCount,
        partnerRole: null,
      });
      setStatus('Kod utworzony. Przekaż go partnerowi.');
    });

  const joinPair = () =>
    handle(async () => {
      const token = await ensureAuth();
      const pair = await api.pairJoin(token, code.trim());
      const pairStatus = await api.pairStatus(token);
      setPairInfo({
        coupleId: pair.coupleId,
        pairCode: pairStatus.code ?? null,
        pairMemberCount: pairStatus.memberCount || pair.memberCount,
        partnerRole:
          pairStatus.partnerRole === 'mother' || pairStatus.partnerRole === 'father'
            ? pairStatus.partnerRole
            : null,
      });
      setStatus('Konta połączone. Wspólny kalendarz i checklista są gotowe.');
    });

  const refreshStatus = () =>
    handle(async () => {
      const token = await ensureAuth();
      const pair = await api.pairStatus(token);
      setPairInfo({
        coupleId: pair.coupleId ?? null,
        pairCode: pair.code ?? null,
        pairMemberCount: pair.memberCount,
        partnerRole:
          pair.partnerRole === 'mother' || pair.partnerRole === 'father' ? pair.partnerRole : null,
      });
      setStatus(pair.paired ? 'Konta połączone.' : 'Kod nadal oczekuje na partnera.');
    });

  const syncAll = () =>
    handle(async () => {
      await autoSync();
      setStatus('Zsynchronizowano — wspólny kalendarz i checklista są aktualne.');
    });

  const leave = () =>
    handle(async () => {
      if (authToken) await api.pairLeave(authToken);
      setPairInfo({ coupleId: null, pairMemberCount: 0, partnerRole: null, pairCode: null });
      setStatus('Rozłączono konta.');
    });

  return (
    <Card>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={type.h3}>
          💑 Tryb pary
        </Text>
        {serverOk !== null && (
          <Text
            accessibilityLabel={serverOk ? 'Serwer API połączony' : 'Serwer API niedostępny'}
            style={styles.health}
          >
            {serverOk ? '🟢' : '🔴'}
          </Text>
        )}
      </View>

      {!coupleId && (
        <View>
          <Text style={[type.small, { marginTop: spacing(0.5) }]}>
            Jedno z Was tworzy kod, drugie wpisuje go u siebie. Wspólne będą tylko kalendarz i
            checklisty.
          </Text>
          <PrimaryButton
            title={busy ? 'Łączenie…' : 'Utwórz kod dla partnera'}
            disabled={busy}
            onPress={createPair}
          />
          <TextInput
            accessibilityLabel="Kod od partnera"
            style={styles.codeInput}
            placeholder="Wpisz kod od partnera"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
          <PrimaryButton
            title="Połącz kodem"
            secondary
            disabled={busy || code.trim().length !== 6}
            onPress={joinPair}
          />
        </View>
      )}

      {waitingForPartner && (
        <View>
          <Text style={[type.body, { marginTop: spacing(1) }]}>
            Czekamy na dołączenie partnera.
          </Text>
          <Text style={[type.small, styles.pairCode]}>{pairCode ?? '—'}</Text>
          <PrimaryButton
            title={busy ? 'Sprawdzam…' : 'Odśwież status'}
            secondary
            disabled={busy}
            onPress={refreshStatus}
          />
        </View>
      )}

      {coupleId && !waitingForPartner && (
        <View>
          <Text style={[type.body, { marginTop: spacing(0.5) }]}>
            Połączone konto:{' '}
            {partnerRole === 'mother'
              ? '👩 mama'
              : partnerRole === 'father'
                ? '👨 tata'
                : 'partner'}
          </Text>
          <Text style={[type.small, { marginTop: spacing(0.5) }]}>
            Notatki, nastrój i dane zdrowia pozostają prywatne.
          </Text>
          <PrimaryButton
            title={busy ? 'Synchronizuję…' : '🔄 Synchronizuj teraz'}
            disabled={busy}
            onPress={syncAll}
          />
          <PrimaryButton
            title="Rozłącz konta"
            secondary
            disabled={busy}
            onPress={() =>
              Alert.alert('Rozłączyć konta?', 'Wspólne dane przestaną się synchronizować.', [
                { text: 'Anuluj', style: 'cancel' },
                { text: 'Rozłącz', style: 'destructive', onPress: leave },
              ])
            }
          />
        </View>
      )}

      {status && <Text style={[type.small, styles.status]}>{status}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  health: { marginLeft: 8, fontSize: 14 },
  codeInput: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: spacing(1.5),
    minHeight: 52,
    marginTop: spacing(2),
    backgroundColor: colors.bg,
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
  },
  pairCode: {
    marginTop: spacing(1),
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
    letterSpacing: 6,
    color: colors.primary,
    fontWeight: '700',
  },
  status: { marginTop: spacing(1), color: colors.success },
});
