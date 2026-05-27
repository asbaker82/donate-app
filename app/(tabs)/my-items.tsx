import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useApp } from '@/store/AppContext';
import { Item, DISPOSAL_METHOD_LABELS } from '@/store/types';
import ItemCard from '@/components/ItemCard';
import { formatCalendarDate } from '@/utils/dates';

const TANGERINE = '#F26B3A';
const TANG_DEEP = '#D8531F';
const CREAM_2   = '#F4ECDD';
const BUTTER    = '#F4C95D';
const ROSE      = '#E89A8D';
const CREAM     = '#FBF6EE';
const INK       = '#1F1A17';
const MUTE      = '#847A70';
const STEEL_BLUE = '#9DB7C9';

const TAB_ACTIVE: Record<string, { bg: string; text: string }> = {
  listing:    { bg: TANGERINE,  text: CREAM },
  claimed:    { bg: BUTTER,     text: INK   },
  waitlisted: { bg: ROSE,       text: CREAM },
  lending:    { bg: STEEL_BLUE, text: CREAM },
};

type Tab = 'listing' | 'claimed' | 'waitlisted' | 'lending';

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

export default function MyItemsScreen() {
  const { items, getMyItems, deleteItem, markDisposed, confirmPickup, releaseClaim, getUserById, currentUser, approveBorrowRequest, rejectBorrowRequest, confirmBorrowReturn, markBorrowReturned } = useApp();
  const router = useRouter();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(tabParam ?? 'listing');
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const myListings = getMyItems();
  const activeListings    = myListings.filter(i => i.status === 'available' || i.status === 'claimed' || i.status === 'pending_pickup');
  const completedListings = myListings.filter(i => i.status === 'picked_up' || i.status === 'disposed');

  const claimedItems    = items.filter(i => i.claimedBy === currentUser.id && i.donorId !== currentUser.id && (i.status === 'claimed' || i.status === 'pending_pickup'));
  const waitlistedItems = items.filter(i => i.waitlist.includes(currentUser.id) && i.donorId !== currentUser.id);

  // Lending tab: items I own that are lend-type, plus items I'm borrowing
  const myBorrowListings = myListings.filter(i => i.listingType === 'borrow');
  const myActiveBorrows  = items.filter(i => i.listingType === 'borrow' && i.donorId !== currentUser.id && (i.borrowedBy === currentUser.id || i.borrowRequests.some(r => r.requesterId === currentUser.id && r.status === 'pending')));
  const lendingCount     = myBorrowListings.reduce((n, i) => n + i.borrowRequests.filter(r => r.status === 'pending').length, 0) + myActiveBorrows.length;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'listing',    label: 'Listing',    count: myListings.length },
    { key: 'claimed',    label: 'Claimed',    count: claimedItems.length },
    { key: 'waitlisted', label: 'Waitlisted', count: waitlistedItems.length },
    { key: 'lending',    label: 'Lending',    count: lendingCount },
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
        {item.claimedBy && item.status !== 'picked_up' && item.status !== 'disposed' && (
          <View style={styles.claimedByChip}>
            <FontAwesome name="user" size={11} color="#7A5C00" style={{ marginRight: 4 }} />
            <Text style={styles.claimedByText}>
              {item.status === 'pending_pickup'
                ? `Pickup pending — ${getUserById(item.claimedBy)?.name ?? 'claimant'}`
                : `Claimed by ${getUserById(item.claimedBy)?.name ?? 'someone'}`}
            </Text>
          </View>
        )}
        {item.waitlist.length > 0 && item.status !== 'pending_pickup' && (
          <View style={styles.waitlistChip}>
            <FontAwesome name="list" size={11} color="#8A3A3A" style={{ marginRight: 4 }} />
            <Text style={styles.waitlistChipText}>{item.waitlist.length} waiting</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {item.status === 'pending_pickup' && (
          <>
            <Pressable style={[styles.actionBtn, styles.actionBtnConfirm]} onPress={() => confirmPickup(item.id)}>
              <FontAwesome name="check" size={13} color={TANGERINE} />
              <Text style={[styles.actionBtnText, { color: TANGERINE }]}>Confirm Pickup</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => releaseClaim(item.id)}>
              <FontAwesome name="undo" size={13} color="#718096" />
              <Text style={styles.actionBtnText}>Not Picked Up</Text>
            </Pressable>
          </>
        )}
        {item.status === 'picked_up' && (
          <Pressable style={styles.actionBtn} onPress={() => releaseClaim(item.id)}>
            <FontAwesome name="undo" size={13} color="#718096" />
            <Text style={styles.actionBtnText}>Release Claim</Text>
          </Pressable>
        )}
        {item.status !== 'picked_up' && item.status !== 'disposed' && item.status !== 'pending_pickup' && (
          <>
            <Pressable style={styles.actionBtn} onPress={() => handleDispose(item)}>
              <FontAwesome name="check-circle" size={14} color="#718096" />
              <Text style={styles.actionBtnText}>Dispose</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleDelete(item)}>
              <FontAwesome name="trash" size={14} color={TANG_DEEP} />
              <Text style={[styles.actionBtnText, { color: TANG_DEEP }]}>Remove</Text>
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
          {TABS.map(t => {
            const active = TAB_ACTIVE[t.key];
            return (
              <Pressable
                key={t.key}
                style={[styles.filterBtn, tab === t.key && { backgroundColor: active.bg }]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.filterBtnText, tab === t.key && { color: active.text }]}>
                  {t.label}
                  {t.count > 0 ? ` (${t.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
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
              <View>
                <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
                {item.status === 'claimed' && item.claimDeadline && (() => {
                  const label = formatTimeLeft(new Date(item.claimDeadline), now);
                  const expired = new Date(item.claimDeadline) <= now;
                  return (
                    <View style={styles.positionRow}>
                      <FontAwesome name="clock-o" size={12} color={expired ? TANG_DEEP : BUTTER} style={{ marginRight: 6 }} />
                      <Text style={[styles.positionText, { color: expired ? TANG_DEEP : INK }]}>
                        {expired ? 'Pickup window expired' : `${label} to pick up`}
                      </Text>
                    </View>
                  );
                })()}
                {item.status === 'pending_pickup' && (
                  <View style={styles.positionRow}>
                    <FontAwesome name="clock-o" size={12} color={MUTE} style={{ marginRight: 6 }} />
                    <Text style={[styles.positionText, { color: MUTE }]}>Waiting for donor to confirm pickup</Text>
                  </View>
                )}
              </View>
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
                    <FontAwesome name="list" size={12} color="#8A3A3A" style={{ marginRight: 6 }} />
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

      {tab === 'lending' && (
        myBorrowListings.length === 0 && myActiveBorrows.length === 0 ? (
          <EmptyState
            icon="refresh"
            title="No lending activity"
            subtitle="List an item as 'Lend Out' to share it with friends temporarily"
          />
        ) : (
          <FlatList
            data={[...myBorrowListings, ...myActiveBorrows.filter(i => !myBorrowListings.find(l => l.id === i.id))]}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isOwner = item.donorId === currentUser.id;
              const pendingReqs = item.borrowRequests.filter(r => r.status === 'pending');
              const myReq = item.borrowRequests.find(r => r.requesterId === currentUser.id && (r.status === 'pending' || r.status === 'approved'));
              return (
                <View>
                  <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
                  <View style={styles.actionRow}>
                    {/* Donor: pending requests */}
                    {isOwner && pendingReqs.map(req => {
                      const requester = getUserById(req.requesterId);
                      return (
                        <View key={req.id} style={styles.borrowReqRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.borrowReqName}>{requester?.name ?? 'Someone'}</Text>
                            <Text style={styles.borrowReqDates}>
                              {new Date(req.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {' – '}
                              {new Date(req.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                          <Pressable style={[styles.actionBtn, { backgroundColor: '#EEF5FA' }]} onPress={() => approveBorrowRequest(item.id, req.id)}>
                            <FontAwesome name="check" size={13} color={STEEL_BLUE} />
                            <Text style={[styles.actionBtnText, { color: STEEL_BLUE }]}>Approve</Text>
                          </Pressable>
                          <Pressable style={styles.actionBtn} onPress={() => rejectBorrowRequest(item.id, req.id)}>
                            <FontAwesome name="times" size={13} color="#718096" />
                            <Text style={styles.actionBtnText}>Decline</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                    {/* Donor: currently borrowed */}
                    {isOwner && item.status === 'borrowed' && (
                      <View style={styles.claimedByChip}>
                        <FontAwesome name="refresh" size={11} color="#7A5C00" style={{ marginRight: 4 }} />
                        <Text style={styles.claimedByText}>
                          Borrowed by {getUserById(item.borrowedBy ?? '')?.name ?? 'someone'}
                          {item.borrowedUntil ? ` until ${formatCalendarDate(item.borrowedUntil)}` : ''}
                        </Text>
                      </View>
                    )}
                    {/* Donor: pending return confirmation */}
                    {isOwner && item.status === 'pending_return' && (
                      <>
                        <View style={styles.waitlistChip}>
                          <FontAwesome name="clock-o" size={11} color="#8A3A3A" style={{ marginRight: 4 }} />
                          <Text style={styles.waitlistChipText}>Return pending</Text>
                        </View>
                        <View style={{ flex: 1 }} />
                        <Pressable style={[styles.actionBtn, styles.actionBtnConfirm]} onPress={() => confirmBorrowReturn(item.id)}>
                          <FontAwesome name="check" size={13} color={TANGERINE} />
                          <Text style={[styles.actionBtnText, { color: TANGERINE }]}>Confirm Return</Text>
                        </Pressable>
                      </>
                    )}
                    {/* Borrower: my request status */}
                    {!isOwner && myReq && (
                      <>
                        <View style={myReq.status === 'approved' ? styles.claimedByChip : styles.waitlistChip}>
                          <FontAwesome name={myReq.status === 'approved' ? 'check' : 'clock-o'} size={11} color={myReq.status === 'approved' ? '#7A5C00' : '#8A3A3A'} style={{ marginRight: 4 }} />
                          <Text style={myReq.status === 'approved' ? styles.claimedByText : styles.waitlistChipText}>
                            {myReq.status === 'approved' ? 'Approved' : 'Request pending'}
                            {' · '}
                            {new Date(myReq.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' – '}
                            {new Date(myReq.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                        {item.status === 'borrowed' && item.borrowedBy === currentUser.id && (
                          <>
                            <View style={{ flex: 1 }} />
                            <Pressable style={[styles.actionBtn, styles.actionBtnConfirm]} onPress={() => markBorrowReturned(item.id)}>
                              <FontAwesome name="undo" size={13} color={TANGERINE} />
                              <Text style={[styles.actionBtnText, { color: TANGERINE }]}>Mark Returned</Text>
                            </Pressable>
                          </>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            }}
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
    borderRadius: 999,
    backgroundColor: '#F4ECDD',
  },
  filterBtnText: { fontSize: 13, color: '#847A70', fontWeight: '600' },
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
    backgroundColor: 'rgba(244,201,93,0.22)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  claimedByText: { fontSize: 12, color: '#7A5C00', fontWeight: '600' },
  waitlistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232,154,141,0.22)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  waitlistChipText: { fontSize: 12, color: '#8A3A3A', fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  actionBtnDanger: { backgroundColor: CREAM_2 },
  actionBtnConfirm: { backgroundColor: CREAM_2 },
  actionBtnText: { fontSize: 12, color: MUTE, fontWeight: '600' },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  positionText: { fontSize: 12, color: '#8A3A3A', fontWeight: '600' },
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
  borrowReqRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF5FA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    gap: 8,
  },
  borrowReqName: { fontSize: 13, fontWeight: '700', color: INK },
  borrowReqDates: { fontSize: 12, color: MUTE },
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
