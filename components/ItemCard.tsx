import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Item, CONDITION_LABELS } from '@/store/types';
import { useApp } from '@/store/AppContext';

interface Props {
  item: Item;
  onPress: () => void;
  distance?: number; // miles from user's address
}

export default function ItemCard({ item, onPress, distance }: Props) {
  const { getUserById } = useApp();
  const donor = getUserById(item.donorId);

  const isBorrow = item.listingType === 'borrow';

  const disposalDate = isBorrow ? null : new Date(item.disposalDate);
  const daysLeft = disposalDate ? Math.ceil((disposalDate.getTime() - Date.now()) / 86400000) : null;
  const isUrgent = daysLeft !== null && daysLeft <= 3;

  const statusStyle = isBorrow
    ? BORROW_STATUS_STYLES[item.status] ?? BORROW_STATUS_STYLES.available
    : STATUS_STYLES[item.status] ?? STATUS_STYLES.available;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.photoArea}>
        {item.photos.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={styles.photo} resizeMode="contain" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <FontAwesome name="image" size={36} color="#C9BCA8" />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {isBorrow ? BORROW_STATUS_LABELS[item.status] ?? 'Borrow' : STATUS_LABELS[item.status]}
          </Text>
        </View>
        {isBorrow && (
          <View style={styles.lendBadge}>
            <Text style={styles.lendBadgeText}>LEND</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.donor}>from {donor?.name ?? 'Unknown'}</Text>

        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{CONDITION_LABELS[item.condition]}</Text>
        </View>

        {item.restrictions ? (
          <View style={styles.restrictionRow}>
            <FontAwesome name="lock" size={11} color="#c05621" style={{ marginRight: 4 }} />
            <Text style={styles.restrictionText} numberOfLines={1}>{item.restrictions}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <FontAwesome name="map-marker" size={12} color={SKY} style={{ marginRight: 4 }} />
            <Text style={styles.footerText} numberOfLines={1}>{item.pickupLocation}</Text>
          </View>
          <View style={styles.footerRight}>
            {distance !== undefined && (
              <View style={styles.distanceChip}>
                <FontAwesome name="location-arrow" size={10} color={SKY} style={{ marginRight: 3 }} />
                <Text style={styles.distanceText}>
                  {distance < 0.1 ? '<0.1' : distance < 10 ? distance.toFixed(1) : Math.round(distance)} mi
                </Text>
              </View>
            )}
            {!isBorrow && daysLeft !== null && (
              <View style={[styles.timeChip, isUrgent && styles.timeChipUrgent]}>
                <FontAwesome
                  name="clock-o"
                  size={11}
                  color={isUrgent ? '#c53030' : '#718096'}
                  style={{ marginRight: 3 }}
                />
                <Text style={[styles.timeText, isUrgent && styles.timeTextUrgent]}>
                  {daysLeft <= 0 ? 'Expired' : daysLeft === 1 ? 'Last day!' : `${daysLeft}d left`}
                </Text>
              </View>
            )}
            {isBorrow && item.borrowedUntil && item.status === 'borrowed' && (
              <View style={styles.timeChip}>
                <FontAwesome name="calendar" size={10} color="#718096" style={{ marginRight: 3 }} />
                <Text style={styles.timeText}>
                  Until {new Date(item.borrowedUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!isBorrow && item.waitlist.length > 0 && (
          <Text style={styles.waitlistText}>
            {item.waitlist.length} {item.waitlist.length === 1 ? 'person' : 'people'} on waitlist
          </Text>
        )}
        {isBorrow && item.borrowRequests.filter(r => r.status === 'pending').length > 0 && (
          <Text style={styles.waitlistText}>
            {item.borrowRequests.filter(r => r.status === 'pending').length} pending {item.borrowRequests.filter(r => r.status === 'pending').length === 1 ? 'request' : 'requests'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// Brand tokens
const TANGERINE      = '#F26B3A';
const TANGERINE_DEEP = '#D8531F';
const CREAM          = '#FBF6EE';
const CREAM_2        = '#F4ECDD';
const INK            = '#1F1A17';
const MUTE           = '#847A70';
const SAGE           = '#7FA88A';
const SKY            = '#9DB7C9';
const ROSE           = '#E89A8D';

const STATUS_LABELS: Record<string, string> = {
  available:       'Free',
  claimed:         'Claimed',
  pending_pickup:  'Pending Pickup',
  picked_up:       'Picked Up',
  disposed:        'Gone',
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  available:       { bg: TANGERINE,  text: CREAM },
  claimed:         { bg: '#F4C95D',  text: INK   },
  pending_pickup:  { bg: '#9DB7C9',  text: CREAM },
  picked_up:       { bg: SAGE,       text: CREAM },
  disposed:        { bg: '#B0A89E',  text: CREAM },
};

const BORROW_STATUS_LABELS: Record<string, string> = {
  available:       'Available',
  borrowed:        'Borrowed',
  pending_return:  'Returning',
};

const BORROW_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  available:       { bg: '#7BA7BC',  text: CREAM },
  borrowed:        { bg: '#F4C95D',  text: INK   },
  pending_return:  { bg: SAGE,       text: CREAM },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CREAM,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 7,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(31,26,23,0.07)',
  },
  cardPressed: { opacity: 0.90 },
  photoArea: {
    height: 160,
    position: 'relative',
    backgroundColor: CREAM_2,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: CREAM_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: '700', color: INK, marginBottom: 2, letterSpacing: -0.2 },
  donor: { fontSize: 13, color: MUTE, marginBottom: 8 },
  conditionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: CREAM_2,
  },
  conditionText: { fontSize: 12, fontWeight: '600', color: INK },
  restrictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3EC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  restrictionText: { fontSize: 12, color: TANGERINE_DEEP, flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  footerText: { fontSize: 12, color: MUTE, flex: 1 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(157,183,201,0.18)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  distanceText: { fontSize: 11, color: '#3A6A82', fontWeight: '600' },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CREAM_2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timeChipUrgent: { backgroundColor: '#FFF3EC' },
  timeText: { fontSize: 12, color: MUTE, fontWeight: '600' },
  timeTextUrgent: { color: '#C53030' },
  waitlistText: { fontSize: 12, color: '#8A3A3A', marginTop: 6, fontWeight: '600' },
  lendBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#7BA7BC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  lendBadgeText: { fontSize: 10, fontWeight: '800', color: CREAM, letterSpacing: 1 },
});
