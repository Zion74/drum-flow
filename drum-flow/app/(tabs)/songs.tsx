import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, FAB, useTheme, Portal, Modal, Button, TextInput } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { db } from '../../src/storage/database';
import { songs, songProgress } from '../../src/storage/schemas';
import { nanoid } from 'nanoid/non-secure';

interface SongRow {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  difficulty: string;
}

export default function SongsScreen() {
  const theme = useTheme();
  const [allSongs, setAllSongs] = useState<SongRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newBpm, setNewBpm] = useState('120');

  const loadSongs = async () => {
    const rows = await db.select().from(songs);
    setAllSongs(rows as SongRow[]);
  };

  useEffect(() => { loadSongs(); }, []);

  const addSong = async () => {
    if (!newName.trim()) return;
    const now = new Date();
    const id = nanoid();
    await db.insert(songs).values({
      id,
      name: newName.trim(),
      artist: newArtist.trim(),
      bpm: parseInt(newBpm) || 120,
      timeSignatureBeats: 4,
      timeSignatureNoteValue: 4,
      difficulty: 'beginner',
      tags: '[]',
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(songProgress).values({
      id: nanoid(),
      songId: id,
      status: 'not_started',
      totalPracticeMinutes: 0,
    });
    setShowAdd(false);
    setNewName('');
    setNewArtist('');
    setNewBpm('120');
    loadSongs();
  };

  const difficultyLabel: Record<string, string> = {
    beginner: '初学',
    intermediate: '中级',
    advanced: '进阶',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>打歌清单</Text>

      <FlatList
        data={allSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#fff' }}>{item.name}</Text>
              <Text variant="bodySmall" style={{ color: '#888' }}>
                {item.artist || '未知艺术家'} · {item.bpm} BPM · {difficultyLabel[item.difficulty] ?? item.difficulty}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 64 }}>
            还没有歌曲，点击 + 添加
          </Text>
        }
      />

      <Portal>
        <Modal
          visible={showAdd}
          onDismiss={() => setShowAdd(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ color: '#fff', marginBottom: 16 }}>添加歌曲</Text>
          <TextInput
            label="歌曲名 *"
            value={newName}
            onChangeText={setNewName}
            style={styles.input}
          />
          <TextInput
            label="艺术家"
            value={newArtist}
            onChangeText={setNewArtist}
            style={styles.input}
          />
          <TextInput
            label="BPM"
            value={newBpm}
            onChangeText={setNewBpm}
            keyboardType="numeric"
            style={styles.input}
          />
          <Button mode="contained" onPress={addSong} style={{ marginTop: 12 }}>
            添加
          </Button>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowAdd(true)}
        color="#000"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { color: '#fff', marginTop: 56, marginBottom: 16 },
  card: { borderRadius: 12, marginBottom: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 28 },
  modal: { margin: 20, padding: 20, borderRadius: 16 },
  input: { marginBottom: 8 },
});
