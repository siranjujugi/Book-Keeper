import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { AssistantChatMessage, askLibraryAssistant } from '@/lib/assistantService';
import { listBooks } from '@/lib/bookRepository';
import { Book } from '@/lib/types';
import { colors } from '@/theme/colors';

const prompts = [
  'Find unread Tamil historical fiction',
  'Which books are loaned out?',
  'Clean up duplicate authors',
  'Suggest missing metadata to review'
];

export function AssistantScreen() {
  const [message, setMessage] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBooks()
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingBooks(false));
  }, []);

  async function onAsk() {
    if (asking) return;
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Enter a question first.');
      return;
    }

    setAsking(true);
    setError(null);
    const userMessage: AssistantChatMessage = { role: 'user', content: trimmed };
    const history = [...messages, userMessage];
    setMessages(history);
    setMessage('');

    try {
      const response = await askLibraryAssistant(trimmed, books, messages);
      setMessages([...history, { role: 'assistant', content: response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assistant request failed.');
      setMessages(messages);
      setMessage(trimmed);
    } finally {
      setAsking(false);
    }
  }

  function resetChat() {
    if (asking) return;
    setMessages([]);
    setMessage('');
    setError(null);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Ionicons name="sparkles-outline" color={colors.gold} size={30} />
        <Text style={styles.title}>Library Assistant</Text>
        <Text style={styles.body}>Ask questions across your collection, shelves, tags, and reading status. AI calls run through a Supabase Edge Function so API keys stay server-side.</Text>
      </View>

      <Section title="Quick Prompts">
        <View style={styles.promptGrid}>
          {prompts.map((prompt) => (
            <Pressable key={prompt} style={styles.prompt} onPress={() => setMessage(prompt)}>
              <Text style={styles.promptText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Conversation" action={`${messages.length} messages`}>
        <View style={styles.contextRow}>
          <Ionicons name="albums-outline" color={colors.accent} size={18} />
          <Text style={styles.contextText}>{loadingBooks ? 'Loading library context...' : `${books.length} books available, last 10 turns sent`}</Text>
        </View>
        {messages.length ? (
          <View style={styles.messages}>
            {messages.map((item, index) => (
              <View key={`${item.role}-${index}`} style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                <Text style={[styles.messageRole, item.role === 'user' && styles.userRole]}>{item.role === 'user' ? 'You' : 'Assistant'}</Text>
                <Text style={[styles.messageText, item.role === 'user' && styles.userMessageText]}>{item.content}</Text>
              </View>
            ))}
            {asking ? (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.messageRole}>Assistant</Text>
                <View style={styles.thinkingRow}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.responseText}>Thinking with conversation context...</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.response}>
            <Text style={styles.responseTitle}>Start a chat</Text>
            <Text style={styles.responseText}>Ask about your collection, then follow up with references like “those books” or “which of them are Tamil?” during this session.</Text>
          </View>
        )}
        <View style={styles.composer}>
          <TextInput
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="Ask about your books..."
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Pressable style={[styles.sendButton, asking && styles.sendButtonDisabled]} onPress={onAsk} disabled={asking || loadingBooks}>
            {asking ? <ActivityIndicator color={colors.surface} /> : <Ionicons name="send" color={colors.surface} size={18} />}
          </Pressable>
        </View>
        {messages.length ? (
          <Pressable style={styles.clearButton} onPress={resetChat} disabled={asking}>
            <Ionicons name="refresh-outline" color={colors.accent} size={18} />
            <Text style={styles.clearButtonText}>New Chat</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    gap: 10,
    padding: 20
  },
  title: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: '900'
  },
  body: {
    color: '#d5dbdc',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  prompt: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  promptText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12
  },
  contextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  contextText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800'
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 92,
    textAlignVertical: 'top'
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  sendButtonDisabled: {
    opacity: 0.72
  },
  messages: {
    gap: 10
  },
  messageBubble: {
    borderRadius: 8,
    gap: 6,
    padding: 12
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    maxWidth: '92%'
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    maxWidth: '96%'
  },
  messageRole: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  userRole: {
    color: '#dcefeb'
  },
  messageText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21
  },
  userMessageText: {
    color: colors.surface
  },
  thinkingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  clearButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  clearButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900'
  },
  response: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 14
  },
  responseTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  responseText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: 6
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800'
  }
});
