import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SectionList, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/store/AppContext';
import ItemCard from '@/components/ItemCard';
import { Item } from '@/store/types';

type Filter = 'listed' | 'active' | 'claimed';

function formatTimeLeft(deadline: Date, now: Date): string {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return '';
  const totalMins = Math.floor(ms / 60000);
  const days  = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins  = totalMins % 60;
  const parts: string[] = [];
  if (days  > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins  > 0 || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(' ');
}

export default function ItemsListScreen() {
  const { filter } = useLocalSearchParams<{ filter: Filter }>();
  const router = useRouter();
  const { items, currentUser } = useApp();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

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
        <View>
          <ItemCard item={item} onPress={() => goToItem(item)} />
          {filter === 'claimed' && item.status === 'claimed' && item.claimDeadline && (() => {
            const deadline = new Date(item.claimDeadline);
            const expired  = deadline <= now;
            const label    = formatTimeLeft(deadline, now);
            return (
              <View style={styles.deadlineRow}>
                <FontAwesome name="clock-o" size={12} color={expired ? '#D8531F' : '#7A5C00'} style={{ marginRight: 6 }} />
                <Text style={[styles.deadlineText, expired && styles.deadlineExpired]}>
                  {expired ? 'Pickup window expired' : `${label} to pick up`}
                </Text>
              </View>
            );
          })()}
          {filter === 'claimed' && item.status === 'pending_pickup' && (
            <View style={styles.deadlineRow}>
              <FontAwesome name="clock-o" size={12} color="#847A70" style={{ marginRight: 6 }} />
              <Text style={[styles.deadlineText, { color: '#847A70' }]}>Waiting for donor to confirm pickup</Text>
            </View>
          )}
        </View>
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
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F4C95D',
  },
  deadlineText: { fontSize: 12, fontWeight: '600', color: '#7A5C00' },
  deadlineExpired: { color: '#D8531F' },
});
