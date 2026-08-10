import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useType, Chip } from '../components/UI';
import { ApiError, askAssistant } from '../services/api';
import { ask, ASSISTANT_DISCLAIMER, SUGGESTED } from '../services/assistant';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/theme';

interface Message {
  id: string;
  from: 'user' | 'bot';
  text: string;
  source?: string;
  isSafety?: boolean;
  pending?: boolean;
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Server-first Q&A with a guarded offline fallback. */
export default function AssistantScreen() {
  const type = useType();
  const largeText = useAppStore((state) => state.largeText);
  const role = useAppStore((state) => state.profile?.role);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      from: 'bot',
      text: `Cześć! ${role === 'father' ? 'Tato' : 'Mamo'}, zapytaj mnie o ciążę, poród albo pierwsze miesiące z dzieckiem.`,
      source: ASSISTANT_DISCLAIMER,
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question) return;

    const pendingId = createId();
    setMessages((current) => [
      ...current,
      { id: createId(), from: 'user', text: question },
      { id: pendingId, from: 'bot', text: '…', pending: true },
    ]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    let reply: Omit<Message, 'id' | 'from'>;
    try {
      const result = await askAssistant(question);
      reply = {
        text: result.answer,
        source: result.reviewedAt
          ? `${result.source} · recenzja medyczna: ${result.reviewedAt}`
          : result.source,
        isSafety: result.isSafety,
      };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
        reply = {
          text: 'Chwila oddechu 🌿 — wysłano zbyt wiele pytań. Spróbuj ponownie za minutę.',
          source: 'Limit API',
        };
      } else {
        const offline = ask(question);
        reply = {
          text: offline.text,
          source: `${offline.source} · tryb offline`,
          isSafety: offline.isSafety,
        };
      }
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === pendingId ? { ...reply, id: pendingId, from: 'bot' as const } : message,
      ),
    );
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            accessibilityLiveRegion={message.from === 'bot' ? 'polite' : 'none'}
            style={[
              styles.bubble,
              message.from === 'user' ? styles.userBubble : styles.botBubble,
              message.isSafety && styles.safetyBubble,
              message.pending && styles.pendingBubble,
            ]}
          >
            <Text style={message.from === 'user' ? [type.body, styles.userText] : type.body}>
              {message.text}
            </Text>
            {message.source && <Text style={[type.small, styles.source]}>{message.source}</Text>}
          </View>
        ))}
        <View style={styles.suggestions}>
          {SUGGESTED.map((suggestion) => (
            <Chip key={suggestion} label={suggestion} onPress={() => void send(suggestion)} />
          ))}
        </View>
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Napisz pytanie"
            style={[styles.input, { fontSize: largeText ? 20 : 16 }]}
            placeholder="Napisz pytanie…"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => void send(input)}
            returnKeyType="send"
            maxLength={1000}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Wyślij"
            accessibilityState={{ disabled: !input.trim() }}
            disabled={!input.trim()}
            onPress={() => void send(input)}
            style={({ pressed }) => [
              styles.sendButton,
              !input.trim() && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  messages: { flex: 1 },
  messagesContent: { padding: spacing(2) },
  bubble: {
    maxWidth: '88%',
    borderRadius: radius.card,
    padding: spacing(1.5),
    marginBottom: spacing(1),
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  safetyBubble: { borderColor: colors.danger, borderWidth: 2 },
  pendingBubble: { opacity: 0.5 },
  userText: { color: '#fff' },
  source: { marginTop: spacing(0.5) },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing(1) },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(1.5),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: spacing(2),
    minHeight: 48,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  sendButton: {
    marginLeft: spacing(1),
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 20 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
});
