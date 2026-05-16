import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Platform,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

function confirm(message: string): boolean {
  if (Platform.OS === 'web') {
    return window.confirm(message);
  }
  return false;
}

function openSms(phone: string, body: string) {
  const encoded = encodeURIComponent(body);
  // iOS uses & separator, Android/web use ?
  const url =
    Platform.OS === 'ios'
      ? `sms:${phone}&body=${encoded}`
      : `sms:${phone}?body=${encoded}`;
  Linking.openURL(url);
}

function openDirections(address: string) {
  const encoded = encodeURIComponent(address);
  const url =
    Platform.OS === 'ios'
      ? `maps://maps.apple.com/?daddr=${encoded}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  Linking.openURL(url);
}
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import {
  DISPOSAL_METHOD_LABELS,
  CONDITION_LABELS,
  CONDITION_COLORS,
} from '@/store/types';
import ImageLightbox from '@/components/ImageLightbox';
import ClaimCelebration from '@/components/ClaimCelebration';
import WaitlistToast from '@/components/WaitlistToast';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    items,
    currentUser,
    getUserById,
    claimItem,
    joinWaitlist,
    leaveWaitlist,
    releaseClaim,
    markPickedUp,
    deleteItem,
  } = useApp();

  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWaitlistToast, setShowWaitlistToast] = useState(false);
  const [smsVisible, setSmsVisible] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');

  const item = items.find(i => i.id === id);
  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found.</Text>
      </View>
    );
  }

  const donor = getUserById(item.donorId);
  const claimedByUser = item.claimedBy ? getUserById(item.claimedBy) : null;
  const isMyItem = item.donorId === currentUser.id;
  const isClaimedByMe = item.claimedBy === currentUser.id;
  const isOnWaitlist = item.waitlist.includes(currentUser.id);

  const disposalDate = new Date(item.disposalDate);
  const daysLeft = Math.ceil((disposalDate.getTime() - Date.now()) / 86400000);
  const isUrgent = daysLeft <= 3;

  const claimDeadline = item.claimDeadline ? new Date(item.claimDeadline) : null;
  const hoursToPickup = claimDeadline
    ? Math.max(0, Math.ceil((claimDeadline.getTime() - Date.now()) / 3600000))
    : null;

  const doClaim = () => {
    claimItem(item.id);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowCelebration(true);
  };

  const handleClaim = () => {
    if (Platform.OS === 'web') {
      if (confirm(`Claim "${item.title}"? You'll have ${item.claimPickupHours} hours to arrange pickup.`)) {
        doClaim();
      }
      return;
    }
    Alert.alert(
      'Claim Item',
      `Claim "${item.title}"? You'll have ${item.claimPickupHours} hours to arrange pickup.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Claim', onPress: doClaim },
      ]
    );
  };

  const handleRelease = () => {
    if (Platform.OS === 'web') {
      if (confirm('Release your claim? The next person on the waitlist will be notified.')) {
        releaseClaim(item.id);
      }
      return;
    }
    Alert.alert(
      'Release Claim',
      'Release your claim? The next person on the waitlist will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Release', style: 'destructive', onPress: () => releaseClaim(item.id) },
      ]
    );
  };

  const handlePickedUp = () => {
    if (Platform.OS === 'web') {
      if (confirm("Confirm that you've picked up this item?")) {
        markPickedUp(item.id);
      }
      return;
    }
    Alert.alert('Mark as Picked Up', "Confirm that you've picked up this item?", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Picked Up', onPress: () => markPickedUp(item.id) },
    ]);
  };

  const handleDeleteItem = () => {
    if (Platform.OS === 'web') {
      if (confirm('Remove this item from your listings?')) {
        deleteItem(item.id);
        router.back();
      }
      return;
    }
    Alert.alert('Remove Listing', 'Remove this item from your listings?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deleteItem(item.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.content}>
      {/* Photos */}
      <View style={styles.photoSection}>
        {item.photos.length > 0 ? (
          <>
            <Pressable onPress={() => { setLightboxIndex(photoIndex); setLightboxOpen(true); }}>
              <Image source={{ uri: item.photos[photoIndex] }} style={styles.mainPhoto} resizeMode="contain" />
            </Pressable>
            {item.photos.length > 1 && (
              <ScrollView horizontal style={styles.thumbRow} showsHorizontalScrollIndicator={false}>
                {item.photos.map((uri, i) => (
                  <Pressable key={i} onPress={() => { setPhotoIndex(i); setLightboxIndex(i); setLightboxOpen(true); }}>
                    <Image
                      source={{ uri }}
                      style={[styles.thumb, i === photoIndex && styles.thumbActive]}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <FontAwesome name="image" size={64} color="#cbd5e0" />
            <Text style={styles.photoPlaceholderText}>No photos</Text>
          </View>
        )}
      </View>

      {/* Status bar */}
      <View style={[styles.statusBar, STATUS_STYLES[item.status]]}>
        <Text style={styles.statusBarText}>{STATUS_LABELS[item.status]}</Text>
        {item.status === 'claimed' && hoursToPickup !== null && (
          <Text style={styles.statusBarSub}>
            {isClaimedByMe ? 'You claimed this · ' : `Claimed by ${claimedByUser?.name ?? 'someone'} · `}
            {hoursToPickup}h to pick up
          </Text>
        )}
      </View>

      {/* Title & condition */}
      <View style={styles.section}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.conditionBadge, { backgroundColor: CONDITION_COLORS[item.condition] }]}>
            <Text style={styles.conditionText}>{CONDITION_LABELS[item.condition]}</Text>
          </View>
          <Text style={styles.donorText}>Listed by {donor?.name ?? 'Unknown'}</Text>
        </View>
      </View>

      {/* Restrictions */}
      {item.restrictions && (
        <View style={styles.restrictionBox}>
          <FontAwesome name="lock" size={14} color="#c05621" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.restrictionTitle}>Restricted Item</Text>
            <Text style={styles.restrictionDesc}>{item.restrictions}</Text>
          </View>
        </View>
      )}

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About this item</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>

      {/* Pickup info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Pickup Details</Text>
        <Pressable style={styles.infoRow} onPress={() => openDirections(item.pickupLocation)}>
          <FontAwesome name="map-marker" size={14} color="#2E8B57" style={styles.infoIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Location — tap for directions</Text>
            <Text style={[styles.infoValue, styles.directionsLink]}>{item.pickupLocation}</Text>
          </View>
          <FontAwesome name="location-arrow" size={14} color="#2E8B57" />
        </Pressable>
        <View style={styles.infoRow}>
          <FontAwesome name="calendar" size={14} color="#2E8B57" style={styles.infoIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Availability</Text>
            <Text style={styles.infoValue}>{item.pickupWindow}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome name="clock-o" size={14} color="#2E8B57" style={styles.infoIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Pickup window after claiming</Text>
            <Text style={styles.infoValue}>{item.claimPickupHours} hours</Text>
          </View>
        </View>
      </View>

      {/* Disposal info */}
      <View style={[styles.infoCard, isUrgent && styles.infoCardUrgent]}>
        <Text style={[styles.infoCardTitle, isUrgent && { color: '#c53030' }]}>
          Disposal Deadline {isUrgent && '⚠️'}
        </Text>
        <View style={styles.infoRow}>
          <FontAwesome
            name="trash"
            size={14}
            color={isUrgent ? '#c53030' : '#718096'}
            style={styles.infoIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={[styles.infoValue, isUrgent && { color: '#c53030', fontWeight: '700' }]}>
              {disposalDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}{' '}
              ({daysLeft <= 0 ? 'expired' : daysLeft === 1 ? 'last day!' : `${daysLeft} days left`})
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <FontAwesome
            name="heart"
            size={14}
            color={isUrgent ? '#c53030' : '#718096'}
            style={styles.infoIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>If unclaimed, goes to</Text>
            <Text style={styles.infoValue}>
              {DISPOSAL_METHOD_LABELS[item.disposalMethod]}
              {item.disposalMethodNote ? ` — ${item.disposalMethodNote}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Waitlist */}
      {item.waitlist.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Waitlist ({item.waitlist.length})</Text>
          {item.waitlist.map((uid, i) => {
            const u = getUserById(uid);
            return (
              <View key={uid} style={styles.waitlistRow}>
                <Text style={styles.waitlistPos}>#{i + 1}</Text>
                <Text style={styles.waitlistName}>
                  {uid === currentUser.id ? 'You' : u?.name ?? 'Someone'}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionSection}>
        {!isMyItem && item.status === 'available' && (
          <Pressable style={styles.primaryBtn} onPress={handleClaim}>
            <FontAwesome name="hand-o-right" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Claim this Item</Text>
          </Pressable>
        )}

        {!isMyItem && item.status === 'claimed' && !isClaimedByMe && !isOnWaitlist && (
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => {
              joinWaitlist(item.id);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              setShowWaitlistToast(true);
            }}
          >
            <FontAwesome name="list" size={15} color="#2E8B57" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>Join Waitlist</Text>
          </Pressable>
        )}

        {!isMyItem && isOnWaitlist && (
          <Pressable style={styles.ghostBtn} onPress={() => leaveWaitlist(item.id)}>
            <FontAwesome name="times" size={15} color="#718096" style={{ marginRight: 8 }} />
            <Text style={styles.ghostBtnText}>Leave Waitlist</Text>
          </Pressable>
        )}

        {!isMyItem && isClaimedByMe && item.status === 'claimed' && (
          <View style={styles.btnGroup}>
            <Pressable style={styles.primaryBtn} onPress={handlePickedUp}>
              <FontAwesome name="check" size={15} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Mark as Picked Up</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={handleRelease}>
              <FontAwesome name="undo" size={14} color="#718096" style={{ marginRight: 8 }} />
              <Text style={styles.ghostBtnText}>Release Claim</Text>
            </Pressable>
          </View>
        )}

        {isMyItem && (
          <View style={styles.btnGroup}>
            <Pressable style={styles.editBtn} onPress={() => router.push(`/item/edit/${item.id}`)}>
              <FontAwesome name="pencil" size={14} color="#2E8B57" style={{ marginRight: 8 }} />
              <Text style={styles.editBtnText}>Edit Listing</Text>
            </Pressable>
            <Pressable style={styles.dangerBtn} onPress={handleDeleteItem}>
              <FontAwesome name="trash" size={14} color="#e53e3e" style={{ marginRight: 8 }} />
              <Text style={styles.dangerBtnText}>Remove Listing</Text>
            </Pressable>
          </View>
        )}

        {/* Text donor — shown to donees when donor has a phone on file */}
        {!isMyItem && donor?.phone && (
          <Pressable
            style={styles.smsBtn}
            onPress={() => {
              setSmsMessage(`Hi ${donor.name}! I'm interested in your "${item.title}". When can I pick this up?`);
              setSmsVisible(true);
            }}
          >
            <FontAwesome name="comment" size={15} color="#3182ce" style={{ marginRight: 8 }} />
            <Text style={styles.smsBtnText}>Text Donor</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>

      {/* Claim celebration overlay */}
      <ClaimCelebration
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Waitlist toast */}
      <WaitlistToast
        visible={showWaitlistToast}
        onComplete={() => setShowWaitlistToast(false)}
      />

      {/* Photo lightbox */}
      <ImageLightbox
        images={item.photos}
        initialIndex={lightboxIndex}
        visible={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* SMS compose modal */}
      <Modal
        visible={smsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSmsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalCard}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Text {donor?.name}</Text>
                  <Text style={styles.modalSubtitle}>{donor?.phone}</Text>
                </View>
                <Pressable onPress={() => setSmsVisible(false)} style={styles.modalClose}>
                  <FontAwesome name="times" size={18} color="#718096" />
                </Pressable>
              </View>

              <Text style={styles.modalLabel}>About</Text>
              <View style={styles.modalItemChip}>
                <FontAwesome name="tag" size={12} color="#2E8B57" style={{ marginRight: 6 }} />
                <Text style={styles.modalItemChipText} numberOfLines={1}>{item.title}</Text>
              </View>

              <Text style={styles.modalLabel}>Message</Text>
              <TextInput
                style={styles.modalInput}
                value={smsMessage}
                onChangeText={setSmsMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder="Type your message…"
                placeholderTextColor="#a0aec0"
                autoFocus
              />

              <Pressable
                style={[styles.modalSendBtn, !smsMessage.trim() && styles.modalSendBtnDisabled]}
                disabled={!smsMessage.trim()}
                onPress={() => {
                  setSmsVisible(false);
                  openSms(donor!.phone!, smsMessage.trim());
                }}
              >
                <FontAwesome name="send" size={14} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.modalSendBtnText}>Open Messages</Text>
              </Pressable>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  claimed: 'Claimed',
  picked_up: 'Picked Up',
  disposed: 'Disposed',
};

const STATUS_STYLES: Record<string, object> = {
  available: { backgroundColor: '#c6f6d5' },
  claimed: { backgroundColor: '#fefcbf' },
  picked_up: { backgroundColor: '#bee3f8' },
  disposed: { backgroundColor: '#e2e8f0' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: '#718096' },
  photoSection: { backgroundColor: '#111' },
  mainPhoto: { width: '100%', height: 280 },
  thumbRow: { paddingHorizontal: 12, paddingVertical: 8 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: { borderColor: '#2E8B57' },
  photoPlaceholder: {
    height: 200,
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  photoPlaceholderText: { color: '#a0aec0', fontSize: 14 },
  statusBar: { paddingHorizontal: 16, paddingVertical: 10 },
  statusBarText: { fontSize: 14, fontWeight: '700', color: '#2d3748' },
  statusBarSub: { fontSize: 13, color: '#4a5568', marginTop: 2 },
  section: { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a202c', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  conditionText: { fontSize: 13, fontWeight: '600', color: '#2d3748' },
  donorText: { fontSize: 13, color: '#718096' },
  restrictionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffaf0',
    borderLeftWidth: 3,
    borderLeftColor: '#ed8936',
    padding: 14,
    marginTop: 8,
  },
  restrictionTitle: { fontSize: 13, fontWeight: '700', color: '#c05621' },
  restrictionDesc: { fontSize: 13, color: '#744210', marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#718096', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 15, color: '#2d3748', lineHeight: 22 },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardUrgent: { borderWidth: 1, borderColor: '#fc8181' },
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: '#2d3748', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  infoIcon: { width: 22, marginTop: 1 },
  infoLabel: { fontSize: 11, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#2d3748' },
  directionsLink: { color: '#2E8B57', textDecorationLine: 'underline' },
  waitlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  waitlistPos: { fontSize: 13, fontWeight: '700', color: '#a0aec0', width: 24 },
  waitlistName: { fontSize: 14, color: '#2d3748' },
  actionSection: { padding: 16, gap: 10 },
  btnGroup: { gap: 10 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E8B57',
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2E8B57',
    paddingVertical: 13,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: '#2E8B57' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf2f7',
    borderRadius: 12,
    paddingVertical: 13,
  },
  ghostBtnText: { fontSize: 15, fontWeight: '600', color: '#718096' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2E8B57',
    paddingVertical: 13,
  },
  editBtnText: { fontSize: 15, fontWeight: '700', color: '#2E8B57' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fc8181',
    paddingVertical: 13,
  },
  dangerBtnText: { fontSize: 15, fontWeight: '600', color: '#e53e3e' },
  smsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ebf8ff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#90cdf4',
    paddingVertical: 13,
  },
  smsBtnText: { fontSize: 15, fontWeight: '700', color: '#3182ce' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a202c' },
  modalSubtitle: { fontSize: 14, color: '#718096', marginTop: 2 },
  modalClose: { padding: 4 },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a0aec0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  modalItemChipText: { fontSize: 13, color: '#2E8B57', fontWeight: '600' },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#2d3748',
    minHeight: 110,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  modalSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182ce',
    borderRadius: 12,
    paddingVertical: 14,
  },
  modalSendBtnDisabled: { opacity: 0.4 },
  modalSendBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
