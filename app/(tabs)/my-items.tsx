import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
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

type Tab = 'listing' | 'claimed' | 'waitlisted';

export default function MyItemsScreen() {
  const { items, getMyItems, deleteItem, markDisposed, getUserById, currentUser } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('listing');

  const myListings = getMyItems();
  const activeListings    = myListings.filter(i => i.status === 'available' || i.status === 'claimed');
  const completedListings = myListings.filter(i => i.status === 'picked_up' || i.status === 'disposed');

  const claimedItems    = items.filter(i => i.claimedBy === currentUser.id && i.donorId !== currentUser.id);
  const waitlistedItems = items.filter(i => i.waitlist.includes(currentUser.id) && i.donorId !== currentUser.id);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'listing',    label: 'Listing',    count: myListings.length },
    { key: 'claimed',    label: 'Claimed',    count: claimedItems.length },
    { key: 'waitlisted', label: 'Waitlisted', count: waitlistedItems.length },
  ];

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

  const renderDonorCard = ({ item }: { item: Item }) => (
    <View>
      <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
      <View style={styles.actionRow}>
        {item.claimedBy && (
          <View style={styles.claimedByChip}>
            <FontAwesome name="user" size={11} color="#F26B3A" style={{ marginRight: 4 }} />
            <Text style={styles.claimedByText}>
              Claimed by {getUserById(item.claimedBy)?.name ?? 'someone'}
            </Text>
          </View>
        )}
        {item.waitlist.length > 0 && (
          <View style={styles.waitlistChip}>
            <FontAwesome name="list" size={11} color="#744210" style={{ marginRight: 4 }} />
            <Text style={styles.waitlistChipText}>{item.waitlist.length} waiting</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {item.status !== 'picked_up' && item.status !== 'disposed' && (
          <>
            <Pressable style={styles.actionBtn} onPress={() => handleDispose(item)}>
              <FontAwesome name="check-circle" size={14} color="#718096" />
              <Text style={styles.actionBtnText}>Dispose</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleDelete(item)}>
              <FontAwesome name="trash" size={14} color="#e53e3e" />
              <Text style={[styles.actionBtnText, { color: '#e53e3e' }]}>Remove</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );

  const listingSections = [
    { title: 'Active', count: activeListings.length, data: activeListings },
    { title: 'Completed', count: completedListings.length, data: completedListings },
  ].filter(s => s.data.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.filterRow}>
          {TABS.map(t => (
            <Pressable
              key={t.key}
              style={[styles.filterBtn, tab === t.key && styles.filterBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.filterBtnText, tab === t.key && styles.filterBtnTextActive]}>
                {t.label}
                {t.count > 0 ? ` (${t.count})` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'listing' && (
        listingSections.length === 0 ? (
          <EmptyState
            icon="gift"
            title="No listings yet"
            subtitle="Tap the + button to list an item for your friends"
          />
        ) : (
          <SectionList
            sections={listingSections}
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
            renderItem={renderDonorCard}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {tab === 'claimed' && (
        claimedItems.length === 0 ? (
          <EmptyState
            icon="hand-o-right"
            title="No claimed items"
            subtitle="Items you claim from friends will appear here"
          />
        ) : (
          <FlatList
            data={claimedItems}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
            )}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {tab === 'waitlisted' && (
        waitlistedItems.length === 0 ? (
          <EmptyState
            icon="list"
            title="Not on any waitlists"
            subtitle="Items you've joined the waitlist for will appear here"
          />
        ) : (
          <FlatList
            data={waitlistedItems}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const pos = item.waitlist.indexOf(currentUser.id) + 1;
              return (
                <View>
                  <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
                  <View style={styles.positionRow}>
                    <FontAwesome name="list" size={12} color="#744210" style={{ marginRight: 6 }} />
                    <Text style={styles.positionText}>You are #{pos} on the waitlist</Text>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/item/new')}>
        <FontAwesome name="plus" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ComponentProps<typeof FontAwesome>['name']; title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <FontAwesome name={icon} size={52} color="#cbd5e0" />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  filterBtnActive: { backgroundColor: '#F26B3A' },
  filterBtnText: { fontSize: 13, color: '#4a5568', fontWeight: '600' },
  filterBtnTextActive: { color: '#fff' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
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
    backgroundColor: '#FFF3EC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  claimedByText: { fontSize: 12, color: '#F26B3A', fontWeight: '600' },
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
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  positionText: { fontSize: 12, color: '#744210', fontWeight: '600' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#a0aec0', marginTop: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: '#cbd5e0',
    marginTop: 4,
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
    backgroundColor: '#F26B3A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
