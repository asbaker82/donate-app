import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppContext';
import { useAuth } from '@/store/AuthContext';

const TANGERINE      = '#F26B3A';
const TANG_DEEP      = '#D8531F';
const CREAM          = '#FBF6EE';
const CREAM_2        = '#F4ECDD';
const INK            = '#1F1A17';
const INK_2          = '#3A332E';
const MUTE           = '#847A70';
const SAGE           = '#7FA88A';
const BUTTER         = '#F4C95D';
const DIVIDER        = 'rgba(31,26,23,0.06)';
const BORDER         = 'rgba(31,26,23,0.10)';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, updateAuthUser } = useAuth();
  const { currentUser, users, getMyItems, items, searchNotifications, updateSearchNotification, deleteSearchNotification } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [friendsExpanded, setFriendsExpanded] = useState(false);

  const handleLogout = () => {
    const doLogout = () => logout();
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of Yoink It?')) doLogout();
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const myItems = getMyItems();
  const friendList = users
    .filter(u => currentUser.friends.includes(u.id))
    .sort((a, b) => {
      const lastName = (n: string) => n.trim().split(' ').slice(-1)[0] ?? n;
      return lastName(a.name).localeCompare(lastName(b.name));
    });

  const removeFriend = (friendId: string) => {
    const activeBorrow = items.find(
      i => i.donorId === friendId &&
           i.borrowedBy === currentUser.id &&
           (i.status === 'borrowed' || i.status === 'pending_return')
    );
    if (activeBorrow) {
      const msg = `You're currently borrowing "${activeBorrow.title}" from this person. Return it before removing them as a friend.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Item Still Borrowed', msg);
      }
      return;
    }

    const doRemove = async () => {
      await updateAuthUser({ friends: currentUser.friends.filter(id => id !== friendId) });
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this friend?')) doRemove();
    } else {
      Alert.alert('Remove Friend', 'Remove this person from your friends?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  const stats = [
    { label: 'Listed',         value: myItems.length,                                                                    icon: 'gift'        as const, color: TANGERINE, filter: 'listed'  as const },
    { label: 'Active',         value: myItems.filter(i => i.status === 'available' || i.status === 'claimed').length,    icon: 'check-circle' as const, color: SAGE,      filter: 'active'  as const },
    { label: 'Claimed by You', value: items.filter(i => i.claimedBy === currentUser.id).length,                          icon: 'hand-o-right' as const, color: BUTTER,    filter: 'claimed' as const },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <Pressable onPress={() => router.push('/edit-profile')} style={styles.avatarWrap}>
          {currentUser.profilePhoto ? (
            <Image source={{ uri: currentUser.profilePhoto }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <FontAwesome name="pencil" size={11} color="#fff" />
          </View>
        </Pressable>
        <Text style={styles.name}>{currentUser.name}</Text>
        {currentUser.phone ? (
          <Text style={styles.meta}>
            {currentUser.phone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4')}
          </Text>
        ) : currentUser.email ? (
          <Text style={styles.meta}>{currentUser.email}</Text>
        ) : null}
        {currentUser.defaultAddress ? (
          <View style={styles.addressRow}>
            <FontAwesome name="map-marker" size={12} color={MUTE} style={{ marginRight: 5 }} />
            <Text style={styles.addressText} numberOfLines={1}>{currentUser.defaultAddress}</Text>
          </View>
        ) : null}
        <View style={styles.profileActions}>
          <Pressable style={({ pressed }) => [styles.editProfileBtn, pressed && { opacity: 0.7 }]} onPress={() => router.push('/edit-profile')}>
            <FontAwesome name="pencil" size={12} color={TANGERINE} style={{ marginRight: 6 }} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]} onPress={handleLogout}>
            <FontAwesome name="sign-out" size={12} color={MUTE} style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map(stat => (
          <Pressable
            key={stat.label}
            style={({ pressed }) => [styles.statCard, pressed && styles.statCardPressed]}
            onPress={() => router.push({ pathname: '/items-list', params: { filter: stat.filter } })}
          >
            <FontAwesome name={stat.icon} size={20} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <FontAwesome name="chevron-right" size={9} color={BORDER} style={styles.statChevron} />
          </Pressable>
        ))}
      </View>

      <View style={[styles.section, { padding: 0, overflow: 'hidden' }]}>
        <Pressable
          style={({ pressed }) => [styles.friendsCardHeader, pressed && { opacity: 0.75 }]}
          onPress={() => setFriendsExpanded(e => !e)}
        >
          <FontAwesome name="users" size={14} color={TANGERINE} style={{ marginRight: 8 }} />
          <Text style={styles.friendsCardTitle}>{friendList.length} Friend{friendList.length !== 1 ? 's' : ''}</Text>
          <FontAwesome
            name={friendsExpanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={MUTE}
            style={{ marginLeft: 6 }}
          />
          <View style={{ flex: 1 }} />
          <Pressable
            style={({ pressed }) => [styles.addFriendsBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/add-friends')}
          >
            <FontAwesome name="user-plus" size={12} color={TANGERINE} style={{ marginRight: 5 }} />
            <Text style={styles.addFriendsBtnText}>Add</Text>
          </Pressable>
        </Pressable>

        {friendsExpanded && (
          friendList.length === 0 ? (
            <View style={styles.friendsExpandedBody}>
              <Text style={[styles.empty, { marginBottom: 12 }]}>No friends yet.</Text>
              <Pressable
                style={({ pressed }) => [styles.addFriendsCTA, pressed && { opacity: 0.85 }]}
                onPress={() => router.push('/add-friends')}
              >
                <FontAwesome name="user-plus" size={14} color={CREAM} style={{ marginRight: 8 }} />
                <Text style={styles.addFriendsCTAText}>Add Friends from Contacts</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              style={[styles.friendsExpandedBody, friendList.length > 5 ? styles.friendScroll : undefined]}
              scrollEnabled={friendList.length > 5}
              showsVerticalScrollIndicator={friendList.length > 5}
              nestedScrollEnabled
            >
              {friendList.map(friend => (
                <View key={friend.id} style={styles.friendRow}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {friend.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    {friend.phone ? (
                      <Text style={styles.friendMeta}>
                        {friend.phone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '($2) $3-$4')}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.friendItemCount}>
                    <Text style={styles.friendItemCountText}>
                      {items.filter(i => i.donorId === friend.id && (i.status === 'available' || i.status === 'claimed')).length} items
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.removeFriendBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => removeFriend(friend.id)}
                    hitSlop={8}
                  >
                    <FontAwesome name="times" size={13} color={MUTE} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )
        )}
      </View>

      {/* Search Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="bell" size={15} color={TANGERINE} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Search Alerts</Text>
        </View>
        {searchNotifications.length === 0 ? (
          <Text style={styles.empty}>
            No alerts yet. Search for an item and tap the{' '}
            <FontAwesome name="bell" size={12} color={MUTE} /> bell to get a text when one is posted.
          </Text>
        ) : (
          searchNotifications.map(notif => (
            <View key={notif.id} style={styles.alertRow}>
              {editingId === notif.id ? (
                <TextInput
                  style={styles.alertEditInput}
                  value={editingText}
                  onChangeText={setEditingText}
                  autoFocus
                  onSubmitEditing={() => {
                    if (editingText.trim()) updateSearchNotification(notif.id, editingText.trim());
                    setEditingId(null);
                  }}
                  returnKeyType="done"
                />
              ) : (
                <>
                  <FontAwesome name="bell" size={13} color={TANGERINE} style={styles.alertIcon} />
                  <Text style={styles.alertKeyword}>{notif.keyword}</Text>
                </>
              )}
              <View style={styles.alertActions}>
                {editingId === notif.id ? (
                  <Pressable
                    style={styles.alertSaveBtn}
                    onPress={() => {
                      if (editingText.trim()) updateSearchNotification(notif.id, editingText.trim());
                      setEditingId(null);
                    }}
                  >
                    <Text style={styles.alertSaveBtnText}>Save</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.alertIconBtn}
                    onPress={() => { setEditingId(notif.id); setEditingText(notif.keyword); }}
                    hitSlop={8}
                  >
                    <FontAwesome name="pencil" size={14} color={MUTE} />
                  </Pressable>
                )}
                <Pressable
                  style={styles.alertIconBtn}
                  hitSlop={8}
                  onPress={() => deleteSearchNotification(notif.id)}
                >
                  <FontAwesome name="trash" size={14} color={TANG_DEEP} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        {[
          { icon: 'camera'    as const, title: 'List Items', desc: 'Take photos and create listings for items you no longer need.' },
          { icon: 'search'    as const, title: 'Browse',     desc: 'See what your friends are giving away and claim what you want.' },
          { icon: 'clock-o'   as const, title: 'Pick Up',    desc: "Coordinate pickup before the donor's disposal deadline." },
          { icon: 'heart'     as const, title: 'Give Back',  desc: 'Unclaimed items go to the charity the donor chooses.' },
        ].map(tip => (
          <View key={tip.title} style={styles.tipRow}>
            <View style={styles.tipIcon}>
              <FontAwesome name={tip.icon} size={16} color={TANGERINE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDesc}>{tip.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  content: { paddingBottom: 40 },

  // Avatar / header
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, backgroundColor: CREAM, gap: 4 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TANGERINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: CREAM },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: INK_2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: CREAM,
  },
  name: { fontSize: 22, fontWeight: '700', color: INK },
  meta: { fontSize: 14, color: MUTE },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, maxWidth: 260 },
  addressText: { fontSize: 13, color: MUTE, flex: 1 },
  profileActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: TANGERINE,
  },
  editProfileBtnText: { fontSize: 13, color: TANGERINE, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoutBtnText: { fontSize: 13, color: MUTE, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', margin: 16, gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: CREAM_2,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardPressed: { opacity: 0.7 },
  statChevron: { marginTop: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: INK, marginTop: 6 },
  statLabel: { fontSize: 11, color: MUTE, marginTop: 2, textAlign: 'center' },

  // Sections
  section: {
    backgroundColor: CREAM_2,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: INK, marginBottom: 12 },

  // Friends collapsible card
  friendsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  friendsCardTitle: { fontSize: 15, fontWeight: '700', color: INK },
  friendsExpandedBody: {
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  addFriendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: TANGERINE,
  },
  addFriendsBtnText: { fontSize: 12, color: TANGERINE, fontWeight: '600' },
  addFriendsCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TANGERINE,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addFriendsCTAText: { fontSize: 14, color: CREAM, fontWeight: '700' },
  friendScroll: { maxHeight: 285 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    gap: 12,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CREAM_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: { fontSize: 14, fontWeight: '700', color: INK_2 },
  friendName: { fontSize: 14, fontWeight: '600', color: INK },
  friendMeta: { fontSize: 12, color: MUTE },
  friendItemCount: {
    backgroundColor: '#FFF3EC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  friendItemCountText: { fontSize: 12, color: TANGERINE, fontWeight: '600' },
  removeFriendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CREAM_2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    flexShrink: 0,
  },

  // Search alerts
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    gap: 10,
  },
  alertIcon: { width: 18 },
  alertKeyword: { flex: 1, fontSize: 14, color: INK, fontWeight: '500' },
  alertEditInput: {
    flex: 1,
    fontSize: 14,
    color: INK,
    borderWidth: 1.5,
    borderColor: TANGERINE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: CREAM,
  },
  alertActions: { flexDirection: 'row', gap: 12 },
  alertIconBtn: { padding: 4 },
  alertSaveBtn: {
    backgroundColor: TANGERINE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  alertSaveBtnText: { fontSize: 13, fontWeight: '700', color: CREAM },

  // How it works
  empty: { color: MUTE, fontSize: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: INK },
  tipDesc: { fontSize: 13, color: MUTE, marginTop: 2 },
});
