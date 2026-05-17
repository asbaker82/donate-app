import React, { useState, useEffect } from 'react';
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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { playClaimSound, playWaitlistSound } from '@/utils/sounds';
import { useApp } from '@/store/AppContext';
import {
  DISPOSAL_METHOD_LABELS,
  CONDITION_LABELS,
} from '@/store/types';
import ImageLightbox from '@/components/ImageLightbox';
import { geocodeAddress, haversineMiles } from '@/utils/geocode';
import ClaimToast from '@/components/ClaimToast';
import WaitlistToast from '@/components/WaitlistToast';
import ConfirmSheet from '@/components/ConfirmSheet';

// ── Brand tokens ─────────────────────────────────────────────
const TANGERINE      = '#F26B3A';
const TANGERINE_DEEP = '#D8531F';
const CREAM          = '#FBF6EE';
const CREAM_2        = '#F4ECDD';
const INK            = '#1F1A17';
const INK_2          = '#3A332E';
const MUTE           = '#847A70';
const SAGE           = '#7FA88A';

// Avatar accent colors cycled by donor initial
const AVATAR_COLORS = [TANGERINE, SAGE, '#F4C95D', '#9DB7C9', '#E89A8D'];
function avatarColor(name: string) {
  const i = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

function confirm(message: string): boolean {
  if (Platform.OS === 'web') return window.confirm(message);
  return false;
}

function openSms(phone: string, body: string) {
  const encoded = encodeURIComponent(body);
  const url = Platform.OS === 'ios'
    ? `sms:${phone}&body=${encoded}`
    : `sms:${phone}?body=${encoded}`;
  Linking.openURL(url);
}

function openDirections(address: string) {
  const encoded = encodeURIComponent(address);
  const url = Platform.OS === 'ios'
    ? `maps://maps.apple.com/?daddr=${encoded}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
  Linking.openURL(url);
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const [photoIndex, setPhotoIndex]           = useState(0);
  const [lightboxOpen, setLightboxOpen]       = useState(false);
  const [lightboxIndex, setLightboxIndex]     = useState(0);
  const [showClaimToast, setShowClaimToast]   = useState(false);
  const [claimDeadlineDate, setClaimDeadlineDate] = useState<Date | null>(null);
  const [showWaitlistToast, setShowWaitlistToast] = useState(false);
  const [showReleaseSheet, setShowReleaseSheet]   = useState(false);
  const [showLeaveWaitlistSheet, setShowLeaveWaitlistSheet] = useState(false);
  const [smsVisible, setSmsVisible]   = useState(false);
  const [smsMessage, setSmsMessage]   = useState('');
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);

  const item = items.find(i => i.id === id);

  useEffect(() => {
    if (!currentUser.defaultAddress || !item) return;
    let cancelled = false;
    (async () => {
      const [userCoords, itemCoords] = await Promise.all([
        geocodeAddress(currentUser.defaultAddress!),
        geocodeAddress(item.pickupLocation),
      ]);
      if (!cancelled && userCoords && itemCoords)
        setDistanceMiles(haversineMiles(userCoords, itemCoords));
    })();
    return () => { cancelled = true; };
  }, [currentUser.defaultAddress, item?.pickupLocation]);

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found.</Text>
      </View>
    );
  }

  const donor          = getUserById(item.donorId);
  const claimedByUser  = item.claimedBy ? getUserById(item.claimedBy) : null;
  const isMyItem       = item.donorId === currentUser.id;
  const isClaimedByMe  = item.claimedBy === currentUser.id;
  const isOnWaitlist   = item.waitlist.includes(currentUser.id);

  const disposalDate = new Date(item.disposalDate);
  const daysLeft     = Math.ceil((disposalDate.getTime() - Date.now()) / 86400000);
  const isUrgent     = daysLeft <= 3;

  const claimDeadline  = item.claimDeadline ? new Date(item.claimDeadline) : null;
  const hoursToPickup  = claimDeadline
    ? Math.max(0, Math.ceil((claimDeadline.getTime() - Date.now()) / 3600000))
    : null;

  const distanceLabel = distanceMiles !== null
    ? distanceMiles < 0.1 ? '<0.1 mi'
    : distanceMiles < 10  ? `${distanceMiles.toFixed(1)} mi`
    : `${Math.round(distanceMiles)} mi`
    : null;

  const handleClaim = () => {
    const deadline = new Date(Date.now() + item.claimPickupHours * 3600000);
    claimItem(item.id);
    playClaimSound();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClaimDeadlineDate(deadline);
    setShowClaimToast(true);
  };

  const handleRelease  = () => setShowReleaseSheet(true);

  const handlePickedUp = () => {
    if (Platform.OS === 'web') {
      if (confirm("Confirm that you've picked up this item?")) markPickedUp(item.id);
      return;
    }
    Alert.alert('Mark as Picked Up', "Confirm that you've picked up this item?", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Picked Up', onPress: () => markPickedUp(item.id) },
    ]);
  };

  const handleDeleteItem = () => {
    if (Platform.OS === 'web') {
      if (confirm('Remove this item from your listings?')) { deleteItem(item.id); router.back(); }
      return;
    }
    Alert.alert('Remove Listing', 'Remove this item from your listings?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { deleteItem(item.id); router.back(); } },
    ]);
  };

  // ── Status badge config ──────────────────────────────────────
  const statusConfig = {
    available: { label: 'Free',       bg: TANGERINE,   text: CREAM  },
    claimed:   { label: 'Claimed',    bg: '#F4C95D',   text: INK    },
    picked_up: { label: 'Picked Up',  bg: SAGE,        text: CREAM  },
    disposed:  { label: 'Gone',       bg: '#B0A89E',   text: CREAM  },
  }[item.status] ?? { label: item.status, bg: CREAM_2, text: INK };

  const hasPhotos = item.photos.length > 0;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ──────────────────────────────────────────── */}
        <View style={styles.heroContainer}>
          {hasPhotos ? (
            <Pressable onPress={() => { setLightboxIndex(photoIndex); setLightboxOpen(true); }}>
              <Image
                source={{ uri: item.photos[photoIndex] }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <View style={styles.heroPlaceholder}>
              <FontAwesome name="image" size={56} color="#C9BCA8" />
              <Text style={styles.heroPlaceholderText}>No photo</Text>
            </View>
          )}

          {/* Floating nav buttons */}
          <View style={[styles.heroNav, { top: insets.top + 12 }]}>
            <Pressable style={styles.circBtn} onPress={() => router.back()}>
              <FontAwesome name="arrow-left" size={14} color={INK} />
            </Pressable>
            <View style={styles.heroNavRight}>
              {!isMyItem && (
                <Pressable style={styles.circBtn}>
                  <FontAwesome name="heart-o" size={14} color={INK} />
                </Pressable>
              )}
              {isMyItem && (
                <Pressable style={styles.circBtn} onPress={() => router.push(`/item/edit/${item.id}`)}>
                  <FontAwesome name="pencil" size={14} color={INK} />
                </Pressable>
              )}
              {isMyItem && (
                <Pressable style={styles.circBtn} onPress={handleDeleteItem}>
                  <FontAwesome name="trash" size={14} color="#E53E3E" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Status + distance chips */}
          <View style={styles.heroBadges}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
            {(distanceLabel || item.status === 'claimed') && (
              <View style={styles.infoPill}>
                <Text style={styles.infoPillText}>
                  {[distanceLabel, item.status === 'claimed' && hoursToPickup !== null ? `${hoursToPickup}h left` : null]
                    .filter(Boolean).join(' · ')}
                </Text>
              </View>
            )}
          </View>

          {/* Photo dots */}
          {item.photos.length > 1 && (
            <View style={styles.dotRow}>
              {item.photos.map((_, i) => (
                <Pressable key={i} onPress={() => setPhotoIndex(i)}>
                  <View style={[styles.dot, i === photoIndex && styles.dotActive]} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Thumbnail strip */}
          {item.photos.length > 1 && (
            <ScrollView horizontal style={styles.thumbStrip} showsHorizontalScrollIndicator={false}>
              {item.photos.map((uri, i) => (
                <Pressable key={i} onPress={() => { setPhotoIndex(i); }}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumb, i === photoIndex && styles.thumbActive]}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Content sheet ─────────────────────────────────── */}
        <View style={styles.sheet}>

          {/* Category row */}
          <Text style={styles.categoryLabel}>
            {item.restrictions ? 'RESTRICTED  ·  ' : ''}
            {item.pickupLocation.split(',')[0].toUpperCase()}
          </Text>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Claimed-by notice */}
          {item.status === 'claimed' && (
            <View style={styles.claimNotice}>
              <FontAwesome name="clock-o" size={13} color={TANGERINE_DEEP} />
              <Text style={styles.claimNoticeText}>
                {isClaimedByMe
                  ? `You claimed this · ${hoursToPickup}h to pick up`
                  : `Claimed by ${claimedByUser?.name ?? 'someone'} · ${hoursToPickup}h left`}
              </Text>
            </View>
          )}

          {/* Restrictions */}
          {item.restrictions && (
            <View style={styles.restrictionBox}>
              <FontAwesome name="lock" size={13} color={TANGERINE_DEEP} />
              <Text style={styles.restrictionText}>{item.restrictions}</Text>
            </View>
          )}

          {/* Giver card */}
          {donor && (
            <View style={styles.giverCard}>
              <View style={[styles.giverAvatar, { backgroundColor: avatarColor(donor.name) }]}>
                <Text style={styles.giverInitial}>{donor.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.giverInfo}>
                <Text style={styles.giverName}>{donor.name}</Text>
                <Text style={styles.giverSub}>
                  {isMyItem ? 'Your listing' : 'Friend'}
                  {' · '}
                  {CONDITION_LABELS[item.condition]}
                </Text>
              </View>
              {!isMyItem && donor.phone && (
                <Pressable
                  style={styles.waveBtn}
                  onPress={() => {
                    setSmsMessage(`Hi ${donor.name}! I'm interested in your "${item.title}". When can I pick this up?`);
                    setSmsVisible(true);
                  }}
                >
                  <Text style={styles.waveBtnText}>Wave 👋</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>

          {/* Details grid */}
          <View style={styles.detailsGrid}>
            {[
              { k: 'Pickup',      v: item.pickupLocation },
              { k: 'Window',      v: item.pickupWindow },
              { k: 'Claim within', v: `${item.claimPickupHours}h of claiming` },
              { k: 'Disposal',    v: `${disposalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${daysLeft <= 0 ? 'expired' : daysLeft === 1 ? 'last day' : `${daysLeft}d left`}${isUrgent ? ' ⚠️' : ''}` },
            ].map((d, i) => (
              <View key={d.k} style={[styles.detailRow, i > 0 && styles.detailRowBorder]}>
                <Text style={styles.detailKey}>{d.k}</Text>
                <Text style={[styles.detailVal, d.k === 'Disposal' && isUrgent && { color: '#C53030' }]}>
                  {d.v}
                </Text>
              </View>
            ))}
          </View>

          {/* Pickup / directions card */}
          <Pressable style={styles.mapCard} onPress={() => openDirections(item.pickupLocation)}>
            <View style={styles.mapPin}>
              <FontAwesome name="map-marker" size={20} color={SAGE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapCardTitle}>Pickup · {item.pickupLocation}</Text>
              <Text style={styles.mapCardSub}>
                Tap for directions
                {distanceLabel ? ` · ${distanceLabel} away` : ''}
              </Text>
            </View>
            <FontAwesome name="location-arrow" size={14} color={MUTE} />
          </Pressable>

          {/* Disposal destination */}
          <View style={styles.disposalCard}>
            <FontAwesome name="heart" size={14} color={MUTE} style={{ marginTop: 1 }} />
            <Text style={styles.disposalText}>
              If unclaimed, goes to{' '}
              <Text style={{ color: INK_2, fontWeight: '600' }}>
                {DISPOSAL_METHOD_LABELS[item.disposalMethod]}
                {item.disposalMethodNote ? ` — ${item.disposalMethodNote}` : ''}
              </Text>
            </Text>
          </View>

          {/* Waitlist */}
          {item.waitlist.length > 0 && (
            <View style={styles.waitlistCard}>
              <View style={styles.waitlistAvatarRow}>
                {item.waitlist.slice(0, 3).map((uid, i) => {
                  const u = getUserById(uid);
                  const name = uid === currentUser.id ? 'You' : u?.name ?? '?';
                  return (
                    <View
                      key={uid}
                      style={[styles.waitlistAvatar, { backgroundColor: avatarColor(name), marginLeft: i > 0 ? -8 : 0 }]}
                    >
                      <Text style={styles.waitlistAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.waitlistLabel}>
                <Text style={{ color: INK, fontWeight: '700' }}>{item.waitlist.length}</Text>
                {item.waitlist.length === 1 ? ' person is' : ' people are'} waiting for this
              </Text>
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── Sticky bottom CTA ────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Donor SMS button — shown to non-owners when donor has phone */}
        {!isMyItem && donor?.phone && (
          <Pressable
            style={styles.chatBtn}
            onPress={() => {
              setSmsMessage(`Hi ${donor.name}! I'm interested in your "${item.title}". When can I pick this up?`);
              setSmsVisible(true);
            }}
          >
            <FontAwesome name="comment" size={18} color={INK} />
          </Pressable>
        )}

        {/* Primary action */}
        {!isMyItem && item.status === 'available' && (
          <Pressable style={styles.primaryBtn} onPress={handleClaim}>
            <Text style={styles.primaryBtnText}>Yoink it </Text>
            <Text style={[styles.primaryBtnText, { fontStyle: 'italic' }]}>→</Text>
          </Pressable>
        )}

        {!isMyItem && item.status === 'claimed' && !isClaimedByMe && !isOnWaitlist && (
          <Pressable
            style={styles.outlineBtn}
            onPress={() => {
              joinWaitlist(item.id);
              playWaitlistSound();
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowWaitlistToast(true);
            }}
          >
            <Text style={styles.outlineBtnText}>Join Waitlist</Text>
          </Pressable>
        )}

        {!isMyItem && isOnWaitlist && (
          <Pressable style={styles.ghostBtn} onPress={() => setShowLeaveWaitlistSheet(true)}>
            <Text style={styles.ghostBtnText}>Leave Waitlist</Text>
          </Pressable>
        )}

        {!isMyItem && isClaimedByMe && item.status === 'claimed' && (
          <View style={styles.btnRow}>
            <Pressable style={styles.primaryBtn} onPress={handlePickedUp}>
              <Text style={styles.primaryBtnText}>Mark Picked Up ✓</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={handleRelease}>
              <Text style={styles.ghostBtnText}>Release Claim</Text>
            </Pressable>
          </View>
        )}

        {isMyItem && (
          <View style={styles.btnRow}>
            <Pressable style={styles.outlineBtn} onPress={() => router.push(`/item/edit/${item.id}`)}>
              <Text style={styles.outlineBtnText}>Edit Listing</Text>
            </Pressable>
            <Pressable style={styles.dangerBtn} onPress={handleDeleteItem}>
              <Text style={styles.dangerBtnText}>Remove</Text>
            </Pressable>
          </View>
        )}

        {/* Disposed / picked-up state */}
        {(item.status === 'picked_up' || item.status === 'disposed') && (
          <View style={styles.doneBar}>
            <Text style={styles.doneText}>
              {item.status === 'picked_up' ? '✓ Picked up — enjoy!' : 'This item is no longer available'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Overlays (siblings of ScrollView, not nested) ─── */}
      <ClaimToast
        visible={showClaimToast}
        deadlineDate={claimDeadlineDate}
        onComplete={() => setShowClaimToast(false)}
      />
      <WaitlistToast
        visible={showWaitlistToast}
        onComplete={() => setShowWaitlistToast(false)}
      />
      <ConfirmSheet
        visible={showLeaveWaitlistSheet}
        title="Leave the Waitlist?"
        message="You'll lose your spot. If a claim opens up, you won't be offered the item."
        confirmLabel="Leave Waitlist"
        cancelLabel="Stay on Waitlist"
        destructive
        onConfirm={() => { setShowLeaveWaitlistSheet(false); leaveWaitlist(item.id); }}
        onCancel={() => setShowLeaveWaitlistSheet(false)}
      />
      <ConfirmSheet
        visible={showReleaseSheet}
        title="Release Your Claim?"
        message={
          item.waitlist.length > 0
            ? 'The next person on the waitlist will be offered the item.'
            : 'The item will go back to available for anyone to claim.'
        }
        confirmLabel="Release Claim"
        cancelLabel="Keep Claim"
        destructive
        onConfirm={() => { setShowReleaseSheet(false); releaseClaim(item.id); }}
        onCancel={() => setShowReleaseSheet(false)}
      />
      <ImageLightbox
        images={item.photos}
        initialIndex={lightboxIndex}
        visible={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* ── SMS modal ─────────────────────────────────────── */}
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
                  <FontAwesome name="times" size={18} color={MUTE} />
                </Pressable>
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
                placeholderTextColor="#C0B8AE"
                autoFocus
              />
              <Pressable
                style={[styles.modalSendBtn, !smsMessage.trim() && { opacity: 0.4 }]}
                disabled={!smsMessage.trim()}
                onPress={() => {
                  setSmsVisible(false);
                  openSms(donor!.phone!, smsMessage.trim());
                }}
              >
                <FontAwesome name="send" size={14} color={CREAM} style={{ marginRight: 8 }} />
                <Text style={styles.modalSendBtnText}>Open Messages</Text>
              </Pressable>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: CREAM },
  scroll:        { flex: 1 },
  notFound:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CREAM },
  notFoundText:  { fontSize: 16, color: MUTE },

  // Hero
  heroContainer:  { position: 'relative', backgroundColor: CREAM_2 },
  heroImage:      { width: '100%', height: 320 },
  heroPlaceholder: {
    height: 280, alignItems: 'center', justifyContent: 'center',
    backgroundColor: CREAM_2, gap: 10,
  },
  heroPlaceholderText: { fontSize: 14, color: '#C0B8AE' },

  heroNav: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  heroNavRight: { flexDirection: 'row', gap: 10 },
  circBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(251,246,238,0.88)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: INK, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },

  heroBadges: {
    position: 'absolute', bottom: 14, left: 16,
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  infoPill: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, backgroundColor: 'rgba(31,26,23,0.76)',
  },
  infoPillText: {
    fontSize: 10, fontWeight: '500', letterSpacing: 1.2,
    textTransform: 'uppercase', color: CREAM,
  },

  dotRow: {
    position: 'absolute', bottom: 14, alignSelf: 'center',
    flexDirection: 'row', gap: 5, right: 16,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(31,26,23,0.3)' },
  dotActive: { width: 16, backgroundColor: INK },

  thumbStrip: { paddingHorizontal: 16, paddingVertical: 10 },
  thumb: {
    width: 60, height: 60, borderRadius: 10, marginRight: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: { borderColor: TANGERINE },

  // Content
  sheet:         { padding: '20px 20px 0' as any, paddingHorizontal: 20, paddingTop: 20 },
  categoryLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 2.5,
    textTransform: 'uppercase', color: TANGERINE_DEEP, marginBottom: 6,
  },
  title: {
    fontSize: 26, fontWeight: '800', color: INK,
    letterSpacing: -0.6, lineHeight: 31, marginBottom: 12,
  },

  claimNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF3EC', borderRadius: 12, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#FDDCC7',
  },
  claimNoticeText: { fontSize: 13, color: TANGERINE_DEEP, fontWeight: '500', flex: 1 },

  restrictionBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFF3EC', borderRadius: 12, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#FDDCC7',
  },
  restrictionText: { fontSize: 13, color: INK_2, flex: 1, lineHeight: 19 },

  // Giver card
  giverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CREAM_2, borderRadius: 16,
    padding: 14, marginBottom: 18,
  },
  giverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  giverInitial: { fontSize: 17, fontWeight: '700', color: CREAM },
  giverInfo:    { flex: 1 },
  giverName:    { fontSize: 15, fontWeight: '700', color: INK },
  giverSub:     { fontSize: 12, color: MUTE, marginTop: 1 },
  waveBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, backgroundColor: INK,
  },
  waveBtnText: { fontSize: 12, fontWeight: '700', color: CREAM },

  description: {
    fontSize: 15, color: INK_2, lineHeight: 22, marginBottom: 18,
  },

  // Details grid
  detailsGrid: {
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(31,26,23,0.08)',
    overflow: 'hidden', marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 11, backgroundColor: CREAM,
    gap: 12,
  },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(31,26,23,0.06)' },
  detailKey: { fontSize: 13, color: MUTE, flex: 0.42 },
  detailVal: { fontSize: 13, color: INK, fontWeight: '600', flex: 0.58, textAlign: 'right' },

  // Map / directions card
  mapCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CREAM_2, borderRadius: 16,
    padding: 14, marginBottom: 12,
  },
  mapPin: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(127,168,138,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  mapCardTitle: { fontSize: 14, fontWeight: '600', color: INK, marginBottom: 2 },
  mapCardSub:   { fontSize: 12, color: MUTE },

  // Disposal
  disposalCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  disposalText: { fontSize: 13, color: MUTE, flex: 1, lineHeight: 19 },

  // Waitlist
  waitlistCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  waitlistAvatarRow:  { flexDirection: 'row' },
  waitlistAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: CREAM,
  },
  waitlistAvatarText: { fontSize: 11, fontWeight: '700', color: CREAM },
  waitlistLabel:      { fontSize: 13, color: MUTE, flex: 1 },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(31,26,23,0.08)',
    backgroundColor: CREAM,
  },
  btnRow: { flexDirection: 'row', gap: 10 },
  chatBtn: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: CREAM_2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(31,26,23,0.10)',
    shadowColor: INK, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  primaryBtn: {
    flex: 1, height: 54, borderRadius: 16,
    backgroundColor: TANGERINE,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: TANGERINE_DEEP, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38, shadowRadius: 14, elevation: 5,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '800', color: CREAM, letterSpacing: -0.3 },
  outlineBtn: {
    flex: 1, height: 54, borderRadius: 16,
    borderWidth: 2, borderColor: TANGERINE,
    alignItems: 'center', justifyContent: 'center',
  },
  outlineBtnText: { fontSize: 16, fontWeight: '700', color: TANGERINE },
  ghostBtn: {
    flex: 1, height: 54, borderRadius: 16,
    backgroundColor: CREAM_2,
    alignItems: 'center', justifyContent: 'center',
  },
  ghostBtnText: { fontSize: 15, fontWeight: '600', color: MUTE },
  dangerBtn: {
    height: 54, paddingHorizontal: 20, borderRadius: 16,
    backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FC8181',
    alignItems: 'center', justifyContent: 'center',
  },
  dangerBtnText: { fontSize: 15, fontWeight: '600', color: '#E53E3E' },
  doneBar: {
    height: 54, borderRadius: 16, backgroundColor: CREAM_2,
    alignItems: 'center', justifyContent: 'center',
  },
  doneText: { fontSize: 14, color: MUTE, fontWeight: '500' },

  // SMS modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: CREAM, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 20,
  },
  modalTitle:    { fontSize: 18, fontWeight: '800', color: INK },
  modalSubtitle: { fontSize: 14, color: MUTE, marginTop: 2 },
  modalClose:    { padding: 4 },
  modalLabel: {
    fontSize: 11, fontWeight: '700', color: MUTE,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5, borderColor: 'rgba(31,26,23,0.14)',
    borderRadius: 12, padding: 12, fontSize: 15, color: INK,
    minHeight: 110, marginBottom: 16, backgroundColor: CREAM_2,
  },
  modalSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: TANGERINE, borderRadius: 14, paddingVertical: 14,
  },
  modalSendBtnText: { fontSize: 16, fontWeight: '700', color: CREAM },
});
