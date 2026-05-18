import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useApp } from '@/store/AppContext';
import ItemCard from '@/components/ItemCard';
import { Item } from '@/store/types';
import { geocodeAddress, haversineMiles } from '@/utils/geocode';

type ListingFilter = 'free' | 'borrow';
type FreeStatusFilter = 'all' | 'available' | 'claimed';
type BorrowStatusFilter = 'all' | 'available' | 'borrowed';

// Levenshtein edit distance
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      dp[i][j] = i === 0 ? j : j === 0 ? i : 0;
    }
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyScore(query: string, item: Item): number {
  const q = query.toLowerCase().trim();
  if (!q) return 1;

  const corpus = `${item.title} ${item.description} ${item.restrictions ?? ''}`.toLowerCase();

  // Exact phrase match wins immediately
  if (corpus.includes(q)) return 100;

  const qTokens = q.split(/\s+/).filter(t => t.length > 1);
  const cTokens = corpus.split(/\s+/).filter(Boolean);

  let totalScore = 0;
  let matchedTokens = 0;

  for (const qt of qTokens) {
    let best = 0;
    for (const ct of cTokens) {
      if (ct.includes(qt) || qt.includes(ct)) {
        best = Math.max(best, 10);
      } else if (qt.length >= 6 && editDistance(qt, ct) <= 1) {
        // Allow 1 typo only for words 6+ chars (e.g. "opener" → "openers")
        best = Math.max(best, 4);
      } else if (qt.length >= 9 && editDistance(qt, ct) <= 2) {
        // Allow 2 typos only for long words (e.g. "bookshelf" → "bookshelve")
        best = Math.max(best, 4);
      }
    }
    if (best > 0) matchedTokens++;
    totalScore += best;
  }

  // For multi-word queries every token must match — no partial hits
  if (qTokens.length > 1 && matchedTokens < qTokens.length) return 0;

  return totalScore;
}

export default function BrowseScreen() {
  const {
    getFriendItems,
    currentUser,
    items,
    searchHistory,
    addToSearchHistory,
    clearSearchHistory,
    searchNotifications,
    addSearchNotification,
  } = useApp();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [listingFilter, setListingFilter] = useState<ListingFilter>('free');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [maxMiles, setMaxMiles] = useState<number | null>(null);

  const handleListingFilterChange = (lf: ListingFilter) => {
    setListingFilter(lf);
    setStatusFilter('all');
  };
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [itemDistances, setItemDistances] = useState<Record<string, number>>({});

  const friendItems = getFriendItems();

  // Geocode user's home address once
  useEffect(() => {
    if (!currentUser.defaultAddress) return;
    geocodeAddress(currentUser.defaultAddress).then(c => { if (c) setUserCoords(c); });
  }, [currentUser.defaultAddress]);

  // Geocode each visible item's pickup address (lazy, cached in module)
  useEffect(() => {
    if (!userCoords) return;
    let cancelled = false;
    (async () => {
      for (const item of friendItems) {
        if (cancelled) break;
        if (item.id in itemDistances) continue;
        const coords = await geocodeAddress(item.pickupLocation);
        if (coords && !cancelled) {
          setItemDistances(prev => ({ ...prev, [item.id]: haversineMiles(userCoords, coords) }));
        }
        // Nominatim rate limit: 1 req/sec
        await new Promise(r => setTimeout(r, 1100));
      }
    })();
    return () => { cancelled = true; };
  }, [userCoords, friendItems.length]);

  const myTurn = items.filter(
    item =>
      item.status === 'claimed' &&
      item.claimedBy === currentUser.id &&
      item.claimDeadline &&
      new Date(item.claimDeadline) > new Date()
  );

  const scored = friendItems
    .map(item => ({ item, score: fuzzyScore(search, item) }))
    .filter(({ score }) => score > 0)
    .filter(({ item }) => listingFilter === 'free' ? item.listingType === 'give' : item.listingType === 'borrow')
    .filter(({ item }) => statusFilter === 'all' || item.status === statusFilter)
    .filter(({ item }) => {
      if (!maxMiles || !userCoords) return true;
      const dist = itemDistances[item.id];
      return dist === undefined || dist <= maxMiles; // show while geocoding
    })
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : new Date(a.item.disposalDate).getTime() - new Date(b.item.disposalDate).getTime()
    );

  const sortedFiltered = scored.map(({ item }) => item);

  const handleSubmitSearch = () => {
    const term = search.trim();
    if (term) addToSearchHistory(term);
    setHistoryOpen(false);
    inputRef.current?.blur();
  };

  const handleSelectHistory = (term: string) => {
    setSearch(term);
    setHistoryOpen(false);
    inputRef.current?.blur();
  };

  const handleClearSearch = () => {
    setSearch('');
    setHistoryOpen(searchHistory.length > 0);
    inputRef.current?.focus();
  };

  const handleSetAlert = async () => {
    const keyword = search.trim();
    if (!keyword) return;
    addToSearchHistory(keyword);
    const alreadyExists = await addSearchNotification(keyword);
    if (alreadyExists) {
      if (Platform.OS === 'web') {
        window.alert(`You already have an alert set for "${keyword}".`);
      } else {
        Alert.alert('Already Set', `You already have an alert for "${keyword}".`);
      }
      return;
    }
    const matches = friendItems.filter(i => fuzzyScore(keyword, i) > 0);
    const matchMsg = matches.length > 0
      ? `\n\n${matches.length} matching item${matches.length > 1 ? 's' : ''} already listed — check the results below.`
      : '';
    if (Platform.OS === 'web') {
      window.alert(`Alert saved for "${keyword}".\n\nWe'll text you when a matching item is posted.${matchMsg}`);
    } else {
      Alert.alert('Alert Saved', `We'll text you when a matching item is posted for "${keyword}".${matchMsg}`);
    }
  };

  const showHistory = historyOpen && searchHistory.length > 0 && !search;

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

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, historyOpen && styles.searchBoxOpen]}>
          <FontAwesome name="search" size={14} color="#a0aec0" style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#a0aec0"
            value={search}
            onChangeText={t => { setSearch(t); setHistoryOpen(!t && searchHistory.length > 0); }}
            onFocus={() => { if (!search && searchHistory.length > 0) setHistoryOpen(true); }}
            onBlur={() => setTimeout(() => setHistoryOpen(false), 150)}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable onPress={handleClearSearch} style={styles.searchAction}>
              <FontAwesome name="times-circle" size={16} color="#a0aec0" />
            </Pressable>
          ) : searchHistory.length > 0 ? (
            <Pressable
              onPress={() => setHistoryOpen(o => !o)}
              style={styles.searchAction}
              hitSlop={8}
            >
              <FontAwesome name="history" size={15} color="#a0aec0" />
            </Pressable>
          ) : null}
        </View>

        {/* Set alert button — shown when there's a search query */}
        {search.trim().length > 0 && (
          <Pressable
            style={[
              styles.alertBtn,
              searchNotifications.some(n => n.keyword.toLowerCase() === search.trim().toLowerCase()) && styles.alertBtnActive,
            ]}
            onPress={handleSetAlert}
            hitSlop={6}
          >
            <FontAwesome
              name="bell"
              size={15}
              color={searchNotifications.some(n => n.keyword.toLowerCase() === search.trim().toLowerCase()) ? '#FBF6EE' : '#F26B3A'}
            />
          </Pressable>
        )}
      </View>

      {/* Search history dropdown */}
      {showHistory && (
        <View style={styles.historyDropdown}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            <Pressable onPress={clearSearchHistory}>
              <Text style={styles.historyClear}>Clear</Text>
            </Pressable>
          </View>
          {searchHistory.map(term => (
            <Pressable
              key={term}
              style={styles.historyRow}
              onPress={() => handleSelectHistory(term)}
            >
              <FontAwesome name="history" size={12} color="#a0aec0" style={styles.historyIcon} />
              <Text style={styles.historyTerm}>{term}</Text>
              <FontAwesome name="arrow-left" size={11} color="#cbd5e0" style={{ transform: [{ rotate: '45deg' }] }} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Listing type filter — Free / Borrow */}
      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterBtn, listingFilter === 'free' && styles.filterBtnActive]}
          onPress={() => handleListingFilterChange('free')}
        >
          <Text style={[styles.filterBtnText, listingFilter === 'free' && styles.filterBtnTextActive]}>
            Free
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterBtn, listingFilter === 'borrow' && styles.filterBtnBorrowActive]}
          onPress={() => handleListingFilterChange('borrow')}
        >
          <Text style={[styles.filterBtnText, listingFilter === 'borrow' && styles.filterBtnTextActive]}>
            Borrow
          </Text>
        </Pressable>
        {search.trim().length > 0 && scored.length > 0 && (
          <Text style={styles.matchCount}>{scored.length} match{scored.length !== 1 ? 'es' : ''}</Text>
        )}
      </View>

      {/* Status filter — conditional on listing type */}
      <View style={styles.filterRow}>
        {listingFilter === 'free' ? (
          (['all', 'available', 'claimed'] as FreeStatusFilter[]).map(f => (
            <Pressable
              key={f}
              style={[styles.filterBtn, styles.statusBtn, statusFilter === f && styles.filterBtnActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterBtnText, statusFilter === f && styles.filterBtnTextActive]}>
                {f === 'all' ? 'All' : f === 'available' ? 'Available' : 'Claimed'}
              </Text>
            </Pressable>
          ))
        ) : (
          (['all', 'available', 'borrowed'] as BorrowStatusFilter[]).map(f => (
            <Pressable
              key={f}
              style={[styles.filterBtn, styles.statusBtn, statusFilter === f && styles.filterBtnBorrowActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterBtnText, statusFilter === f && styles.filterBtnTextActive]}>
                {f === 'all' ? 'All' : f === 'available' ? 'Available' : 'Borrowed'}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Distance filter row — always visible */}
      <View style={styles.filterRow}>
        <FontAwesome name="location-arrow" size={12} color="#847A70" style={{ marginRight: 2 }} />
        {currentUser.defaultAddress ? (
          ([null, 5, 10, 25, 50] as (number | null)[]).map(miles => (
            <Pressable
              key={miles ?? 'any'}
              style={[styles.filterBtn, styles.distanceBtn, maxMiles === miles && styles.distanceBtnActive]}
              onPress={() => setMaxMiles(miles)}
            >
              <Text style={[styles.filterBtnText, styles.distanceBtnText, maxMiles === miles && styles.distanceBtnTextActive]}>
                {miles === null ? 'Any' : `≤ ${miles} mi`}
              </Text>
            </Pressable>
          ))
        ) : (
          <Pressable onPress={() => router.push('/edit-profile')} style={styles.setAddressPrompt}>
            <Text style={styles.setAddressText}>Set your address in Profile to filter by distance →</Text>
          </Pressable>
        )}
      </View>

      {sortedFiltered.length === 0 ? (
        <View style={styles.empty}>
          <FontAwesome
            name={!search.trim() && currentUser.friends.length === 0 ? 'users' : 'inbox'}
            size={52}
            color="#cbd5e0"
          />
          <Text style={styles.emptyTitle}>
            {search.trim()
              ? 'No matches found'
              : currentUser.friends.length === 0
                ? 'No friends added yet'
                : 'No items found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search.trim()
              ? 'Try different words, or set an alert to be notified when one is posted.'
              : currentUser.friends.length === 0
                ? 'Add friends to see what they\'re giving away.'
                : 'Try adjusting your filter'}
          </Text>
          {!search.trim() && currentUser.friends.length === 0 && (
            <Pressable style={styles.emptyAddFriendsBtn} onPress={() => router.push('/add-friends')}>
              <FontAwesome name="user-plus" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddFriendsBtnText}>Add Friends from Contacts</Text>
            </Pressable>
          )}
          {search.trim().length > 0 && (
            <Pressable style={styles.emptyAlertBtn} onPress={handleSetAlert}>
              <FontAwesome name="bell" size={14} color="#D8531F" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAlertBtnText}>Set Alert for "{search.trim()}"</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={sortedFiltered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={() => { addToSearchHistory(search.trim()); router.push(`/item/${item.id}`); }} distance={itemDistances[item.id]} />
          )}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  banner: {
    backgroundColor: '#F26B3A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerText: { flex: 1, color: '#FBF6EE', fontWeight: '600', fontSize: 14 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#1F1A17',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchBoxOpen: { borderColor: '#F26B3A', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  searchInput: { flex: 1, fontSize: 15, color: '#1F1A17' },
  searchAction: { padding: 2 },
  alertBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF3EC',
    borderWidth: 1.5,
    borderColor: '#F26B3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnActive: { backgroundColor: '#F26B3A' },

  // History dropdown
  historyDropdown: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#F26B3A',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#1F1A17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  historyTitle: { fontSize: 11, fontWeight: '700', color: '#847A70', textTransform: 'uppercase', letterSpacing: 0.4 },
  historyClear: { fontSize: 12, color: '#e53e3e', fontWeight: '600' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31,26,23,0.06)',
    gap: 10,
  },
  historyIcon: { width: 16 },
  historyTerm: { flex: 1, fontSize: 14, color: '#1F1A17' },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F4ECDD',
  },
  filterBtnActive: { backgroundColor: '#F26B3A' },
  filterBtnBorrowActive: { backgroundColor: '#7BA7BC' },
  filterBtnText: { fontSize: 13, color: '#847A70', fontWeight: '600' },
  filterBtnTextActive: { color: '#FBF6EE' },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 5 },
  matchCount: { fontSize: 12, color: '#847A70', marginLeft: 'auto' },
  distanceBtn: { backgroundColor: '#F4ECDD', borderWidth: 1, borderColor: 'rgba(31,26,23,0.1)' },
  distanceBtnActive: { backgroundColor: '#9DB7C9', borderColor: '#9DB7C9' },
  distanceBtnText: { color: '#847A70' },
  distanceBtnTextActive: { color: '#FBF6EE' },
  setAddressPrompt: { flex: 1 },
  setAddressText: { fontSize: 12, color: '#847A70', fontStyle: 'italic' },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#B0A89E', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#C9BCA8', textAlign: 'center' },
  emptyAddFriendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F26B3A',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  emptyAddFriendsBtnText: { fontSize: 14, color: '#FBF6EE', fontWeight: '700' },
  emptyAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFF3EC',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#F26B3A',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyAlertBtnText: { fontSize: 13, color: '#D8531F', fontWeight: '600' },
});
