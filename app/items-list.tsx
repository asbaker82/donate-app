import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '@/store/AppContext';
import ItemCard from '@/components/ItemCard';

type Filter = 'listed' | 'active' | 'claimed';

const TITLES: Record<Filter, string> = {
  listed: 'My Listings',
  active: 'Active Listings',
  claimed: 'Claimed by You',
};

export default function ItemsListScreen() {
  const { filter } = useLocalSearchParams<{ filter: Filter }>();
  const router = useRouter();
  const { items, currentUser } = useApp();

  const filtered = (() => {
    switch (filter) {
      case 'listed':
        return items.filter(i => i.donorId === currentUser.id);
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

  return (
    <View style={styles.container}>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No items here yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  list: { paddingVertical: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: '#a0aec0' },
});
