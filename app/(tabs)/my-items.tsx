import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useApp } from '@/store/AppContext';
import { Item, DISPOSAL_METHOD_LABELS } from '@/store/types';
import ItemCard from '@/components/ItemCard';

type Filter = 'active' | 'completed';

export default function MyItemsScreen() {
  const { getMyItems, deleteItem, markDisposed, getUserById } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('active');

  const allMine = getMyItems();
  const active = allMine.filter(i => i.status === 'available' || i.status === 'claimed');
  const completed = allMine.filter(i => i.status === 'picked_up' || i.status === 'disposed');
  const displayItems = filter === 'active' ? active : completed;

  const handleDelete = (item: Item) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${item.title}" from your listings?`)) deleteItem(item.id);
      return;
    }
    Alert.alert('Remove Listing', `Remove "${item.title}" from your listings?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteItem(item.id) },
    ]);
  };

  const handleDispose = (item: Item) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Mark "${item.title}" as disposed (${DISPOSAL_METHOD_LABELS[item.disposalMethod]})?`)) markDisposed(item.id);
      return;
    }
    Alert.alert(
      'Mark as Disposed',
      `Mark "${item.title}" as disposed (${DISPOSAL_METHOD_LABELS[item.disposalMethod]})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Dispose', onPress: () => markDisposed(item.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.filterRow}>
          {(['active', 'completed'] as Filter[]).map(f => (
            <Pressable
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                {f === 'active'
                  ? `Active (${active.length})`
                  : `Completed (${completed.length})`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {displayItems.length === 0 ? (
        <View style={styles.empty}>
          <FontAwesome name="gift" size={52} color="#cbd5e0" />
          <Text style={styles.emptyTitle}>
            {filter === 'active' ? 'No active listings' : 'No completed items'}
          </Text>
          {filter === 'active' && (
            <Text style={styles.emptySubtitle}>
              Tap the + button to list an item for your friends
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View>
              <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
              <View style={styles.actionRow}>
                {item.claimedBy && (
                  <View style={styles.claimedByChip}>
                    <FontAwesome name="user" size={11} color="#2E8B57" style={{ marginRight: 4 }} />
                    <Text style={styles.claimedByText}>
                      Claimed by {getUserById(item.claimedBy)?.name ?? 'someone'}
                    </Text>
                  </View>
                )}
                {item.waitlist.length > 0 && (
                  <View style={styles.waitlistChip}>
                    <FontAwesome name="list" size={11} color="#744210" style={{ marginRight: 4 }} />
                    <Text style={styles.waitlistChipText}>
                      {item.waitlist.length} waiting
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                {item.status !== 'picked_up' && item.status !== 'disposed' && (
                  <>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => handleDispose(item)}
                    >
                      <FontAwesome name="check-circle" size={14} color="#718096" />
                      <Text style={styles.actionBtnText}>Dispose</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.actionBtnDanger]}
                      onPress={() => handleDelete(item)}
                    >
                      <FontAwesome name="trash" size={14} color="#e53e3e" />
                      <Text style={[styles.actionBtnText, { color: '#e53e3e' }]}>Remove</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/item/new')}>
        <FontAwesome name="plus" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  filterBtnActive: { backgroundColor: '#2E8B57' },
  filterBtnText: { fontSize: 13, color: '#4a5568', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  claimedByChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  claimedByText: { fontSize: 12, color: '#2E8B57', fontWeight: '600' },
  waitlistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffaf0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  waitlistChipText: { fontSize: 12, color: '#744210', fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  actionBtnDanger: { backgroundColor: '#fff5f5' },
  actionBtnText: { fontSize: 12, color: '#718096', fontWeight: '600' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#a0aec0', marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: '#cbd5e0',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E8B57',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
