import React from 'react';
import { View, Text, StyleSheet, FlatList, SectionList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/store/AppContext';
import ItemCard from '@/components/ItemCard';
import { Item } from '@/store/types';

type Filter = 'listed' | 'active' | 'claimed';

export default function ItemsListScreen() {
  const { filter } = useLocalSearchParams<{ filter: Filter }>();
  const router = useRouter();
  const { items, currentUser } = useApp();

  const goToItem = (item: Item) => router.push(`/item/${item.id}`);

  if (filter === 'listed') {
    const myItems = items.filter(i => i.donorId === currentUser.id);
    const active    = myItems.filter(i => i.status === 'available' || i.status === 'claimed');
    const completed = myItems.filter(i => i.status === 'picked_up' || i.status === 'disposed');

    const sections = [
      { title: 'Active', count: active.length, data: active },
      { title: 'Completed', count: completed.length, data: completed },
    ].filter(s => s.data.length > 0);

    if (sections.length === 0) {
      return <EmptyState message="You haven't listed any items yet." />;
    }

    return (
      <SectionList
        style={styles.container}
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{section.count}</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <ItemCard item={item} onPress={() => goToItem(item)} />
        )}
        contentContainerStyle={styles.list}
      />
    );
  }

  // Flat list for other filters
  const filtered = (() => {
    switch (filter) {
      case 'active':
        return items.filter(
          i => i.donorId === currentUser.id && (i.status === 'available' || i.status === 'claimed')
        );
      case 'claimed':
        return items.filter(i => i.claimedBy === currentUser.id);
      default:
        return [];
    }
  })();

  if (filtered.length === 0) {
    return <EmptyState message="No items here yet." />;
  }

  return (
    <FlatList
      style={styles.container}
      data={filtered}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <ItemCard item={item} onPress={() => goToItem(item)} />
      )}
      contentContainerStyle={styles.list}
    />
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={[styles.container, styles.empty]}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  list: { paddingVertical: 8, paddingBottom: 24 },
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: '#a0aec0' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a0aec0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  sectionCountText: { fontSize: 12, fontWeight: '700', color: '#718096' },
});
