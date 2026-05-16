import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useApp } from '@/store/AppContext';
import ItemCard from '@/components/ItemCard';

type Filter = 'all' | 'available' | 'claimed';

export default function BrowseScreen() {
  const { getFriendItems, currentUser, items } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const friendItems = getFriendItems();

  const myTurn = items.filter(
    item =>
      item.status === 'claimed' &&
      item.claimedBy === currentUser.id &&
      item.claimDeadline &&
      new Date(item.claimDeadline) > new Date()
  );

  const filtered = friendItems.filter(item => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    const matchesFilter = filter === 'all' || item.status === filter;
    return matchesSearch && matchesFilter;
  });

  const sortedFiltered = [...filtered].sort(
    (a, b) => new Date(a.disposalDate).getTime() - new Date(b.disposalDate).getTime()
  );

  return (
    <View style={styles.container}>
      {myTurn.length > 0 && (
        <Pressable
          style={styles.banner}
          onPress={() => router.push(`/item/${myTurn[0].id}`)}
        >
          <FontAwesome name="bell" size={14} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.bannerText}>
            You have {myTurn.length} item{myTurn.length > 1 ? 's' : ''} waiting for pickup!
          </Text>
          <FontAwesome name="chevron-right" size={12} color="#fff" />
        </Pressable>
      )}

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <FontAwesome name="search" size={14} color="#a0aec0" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#a0aec0"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <FontAwesome name="times-circle" size={16} color="#a0aec0" />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'available', 'claimed'] as Filter[]).map(f => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === 'all' ? 'All' : f === 'available' ? 'Available' : 'Claimed'}
            </Text>
          </Pressable>
        ))}
      </View>

      {sortedFiltered.length === 0 ? (
        <View style={styles.empty}>
          <FontAwesome name="inbox" size={52} color="#cbd5e0" />
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptySubtitle}>
            {friendItems.length === 0
              ? 'Items from your friends will appear here'
              : 'Try adjusting your search or filter'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedFiltered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
          )}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  banner: {
    backgroundColor: '#276749',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerText: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 14 },
  searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#2d3748' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  filterBtnActive: { backgroundColor: '#2E8B57' },
  filterBtnText: { fontSize: 13, color: '#4a5568', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#a0aec0', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#cbd5e0', marginTop: 6, textAlign: 'center' },
});
