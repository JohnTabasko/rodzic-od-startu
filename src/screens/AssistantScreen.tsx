import React, { useState, useRef } from 'react';
import { ScrollView, Text, TextInput, Pressable, View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useType, Chip } from '../components/UI';
import { ask, ASSISTANT_DISCLAIMER, SUGGESTED } from '../services/assistant';
import { askAssistant } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, radius } from '../theme/theme';

interface Msg {
  id: string; from: 'user' | 'bot'; text: string;
  source?: string; isSafety?: boolean; offline?: boolean; pending?: boolean;
}

/** Asystent: preferuje serwer (baza wiedzy z datą recenzji medycznej + log jakości),
 *  przy braku sieci przełącza się na lokalny silnik offline (guardrails działają w obu). */
export default function AssistantScreen() {
  const type = useType();
  const large = useAppStore(s => s.largeText);
  const role = useAppStore.getState().profile?.role;
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'g0', from: 'bot', text: `Cześć! ${role === 'father' ? 'Tato' : 'Mamo'}, zapytaj mnie o ciążę, poród albo pierwsze miesiące z dzieckiem.`, source: ASSISTANT_DISCLAIMER },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const uid = () => Math.random().toString(36).slice(2, 10);

  const send = async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const pendingId = uid();
    setMessages(prev => [
      ...prev,
      { id: uid(), from: 'user', text: q },
      { id: pendingId, from: 'bot', text: '…', pending: true },
    ]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    let reply: Omit<Msg, 'id' | 'from'>;
    try {
      const r = await askAssistant(q); // serwerowe Q&A (RAG krok 1)
      reply = {
        text: r.answer,
        source: r.reviewedAt ? `${r.source} · recenzja medyczna: ${r.reviewedAt}` : r.source,
        isSafety: r.isSafety,
      };
    } catch (e: any) {
      if (String(e?.message ?? '').includes('RATE_LIMITED')) {
        reply = { text: 'Chwila oddechu 🌿 — wysłano zbyt wiele pytań w krótkim czasie. Odpowiedz na poprzednią kartę albo spróbuj ponownie za minutę. Prywatnie: mogę w tym czasie odpowiadać też offline.', source: 'Limit API' };
      } else {
        const r = ask(q); // tryb offline — lokalna baza (zawsze z guardrails)
        reply = { text: r.text, source: `${r.source} · tryb offline`, isSafety: r.isSafety, offline: true };
      }
    }
    setMessages(prev => prev.map(m => m.id === pendingId ? { ...reply, id: pendingId, from: 'bot' as const } : m));
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <View style={styles.root}>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: spacing(2) }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {messages.map(m => (
          <View key={m.id}
            accessibilityLiveRegion={m.from === 'bot' ? 'polite' : 'none'}
            style={[styles.bubble, m.from === 'user' ? styles.userBubble : styles.botBubble,
                    m.isSafety && { borderColor: colors.danger, borderWidth: 2 },
                    m.pending && { opacity: 0.5 }]}>
            <Text style={m.from === 'user' ? [type.body, { color: '#fff' }] : type.body}>{m.text}</Text>
            {m.source && <Text style={[type.small, { marginTop: spacing(0.5), color: m.from === 'user' ? '#ffe' : colors.textMuted }]}>{m.source}</Text>}
          </View>
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing(1) }}>
          {SUGGESTED.map(s => <Chip key={s} label={s} onPress={() => send(s)} />)}
        </View>
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Napisz pytanie"
            style={[styles.input, { fontSize: large ? 20 : 16 }]}
            placeholder="Napisz pytanie…"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Wyślij" onPress={() => send(input)} style={styles.sendBtn}>
            <Text style={{ color: '#fff', fontSize: 20 }}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bubble: { maxWidth: '88%', borderRadius: radius.card, padding: spacing(1.5), marginBottom: spacing(1) },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: spacing(1.5), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 24, paddingHorizontal: spacing(2), minHeight: 48, color: colors.text, backgroundColor: colors.bg },
  sendBtn: { marginLeft: spacing(1), width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
