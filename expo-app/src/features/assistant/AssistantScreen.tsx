import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { colors } from '@/theme/colors';

const prompts = [
  'Find unread Tamil historical fiction',
  'Which books are loaned out?',
  'Clean up duplicate authors',
  'Suggest missing metadata to review'
];

export function AssistantScreen() {
  const [message, setMessage] = useState('');

  return (
    <Screen>
      <View style={styles.header}>
        <Ionicons name="sparkles-outline" color={colors.gold} size={30} />
        <Text style={styles.title}>Library Assistant</Text>
        <Text style={styles.body}>Ask questions across your collection, notes, shelves, and reading history. AI calls will run through a Supabase Edge Function so API keys stay server-side.</Text>
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

      <Section title="Ask">
        <View style={styles.composer}>
          <TextInput
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="Ask about your books..."
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Pressable style={styles.sendButton}>
            <Ionicons name="send" color={colors.surface} size={18} />
          </Pressable>
        </View>
        <View style={styles.response}>
          <Text style={styles.responseTitle}>Planned AI behavior</Text>
          <Text style={styles.responseText}>The assistant will use structured tool calls for database search, semantic retrieval, metadata cleanup, and book enrichment.</Text>
        </View>
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
  }
});
