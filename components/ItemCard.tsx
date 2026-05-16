import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Item, CONDITION_LABELS, CONDITION_COLORS } from '@/store/types';
import { useApp } from '@/store/AppContext';

interface Props {
  item: Item;
  onPress: () => void;
}

export default function ItemCard({ item, onPress }: Props) {
  const { getUserById } = useApp();
  const donor = getUserById(item.donorId);

  const disposalDate = new Date(item.disposalDate);
  const daysLeft = Math.ceil((disposalDate.getTime() - Date.now()) / 86400000);
  const isUrgent = daysLeft <= 3;

  const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.available;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.photoArea}>
        {item.photos.length > 0 ? (
          <Image source={{ uri: item.photos[0] }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <FontAwesome name="image" size={36} color="#cbd5e0" />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.donor}>from {donor?.name ?? 'Unknown'}</Text>

        <View style={[styles.conditionBadge, { backgroundColor: CONDITION_COLORS[item.condition] }]}>
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
            <FontAwesome name="map-marker" size={12} color="#718096" style={{ marginRight: 4 }} />
            <Text style={styles.footerText} numberOfLines={1}>{item.pickupLocation}</Text>
          </View>
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
        </View>

        {item.waitlist.length > 0 && (
          <Text style={styles.waitlistText}>
            {item.waitlist.length} {item.waitlist.length === 1 ? 'person' : 'people'} on waitlist
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  claimed: 'Claimed',
  picked_up: 'Picked Up',
  disposed: 'Disposed',
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  available: { bg: '#c6f6d5', text: '#276749' },
  claimed: { bg: '#fefcbf', text: '#744210' },
  picked_up: { bg: '#bee3f8', text: '#2a4365' },
  disposed: { bg: '#e2e8f0', text: '#4a5568' },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.92 },
  photoArea: {
    height: 160,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: '700', color: '#2d3748', marginBottom: 2 },
  donor: { fontSize: 13, color: '#718096', marginBottom: 8 },
  conditionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  conditionText: { fontSize: 12, fontWeight: '600', color: '#2d3748' },
  restrictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffaf0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  restrictionText: { fontSize: 12, color: '#c05621', flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  footerText: { fontSize: 12, color: '#718096', flex: 1 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timeChipUrgent: { backgroundColor: '#fff5f5' },
  timeText: { fontSize: 12, color: '#718096', fontWeight: '600' },
  timeTextUrgent: { color: '#c53030' },
  waitlistText: { fontSize: 12, color: '#2E8B57', marginTop: 6, fontWeight: '600' },
});
