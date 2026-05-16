import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppContext';
import { useAuth } from '@/store/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { currentUser, users, getMyItems, items, searchNotifications, updateSearchNotification, deleteSearchNotification } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

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
  const claimedByMe = items.filter(
    i => i.claimedBy === currentUser.id || i.status === 'picked_up'
  );
  const friendList = users.filter(u => currentUser.friends.includes(u.id));

  const stats = [
    { label: 'Listed', value: myItems.length, icon: 'gift' as const, color: '#10B981', filter: 'listed' as const },
    { label: 'Active', value: myItems.filter(i => i.status === 'available' || i.status === 'claimed').length, icon: 'check-circle' as const, color: '#3182ce', filter: 'active' as const },
    { label: 'Claimed by You', value: items.filter(i => i.claimedBy === currentUser.id).length, icon: 'hand-o-right' as const, color: '#d69e2e', filter: 'claimed' as const },
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
          <Text style={styles.email}>
            {currentUser.phone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4')}
          </Text>
        ) : currentUser.email ? (
          <Text style={styles.email}>{currentUser.email}</Text>
        ) : null}
        {currentUser.defaultAddress ? (
          <View style={styles.addressRow}>
            <FontAwesome name="map-marker" size={12} color="#718096" style={{ marginRight: 5 }} />
            <Text style={styles.addressText} numberOfLines={1}>{currentUser.defaultAddress}</Text>
          </View>
        ) : null}
        <View style={styles.profileActions}>
          <Pressable style={({ pressed }) => [styles.editProfileBtn, pressed && { opacity: 0.7 }]} onPress={() => router.push('/edit-profile')}>
            <FontAwesome name="pencil" size={12} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]} onPress={handleLogout}>
            <FontAwesome name="sign-out" size={12} color="#718096" style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map(stat => (
          stat.filter ? (
            <Pressable
              key={stat.label}
              style={({ pressed }) => [styles.statCard, styles.statCardLink, pressed && styles.statCardPressed]}
              onPress={() => router.push({ pathname: '/items-list', params: { filter: stat.filter } })}
            >
              <FontAwesome name={stat.icon} size={20} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <FontAwesome name="chevron-right" size={9} color="#cbd5e0" style={styles.statChevron} />
            </Pressable>
          ) : (
            <View key={stat.label} style={styles.statCard}>
              <FontAwesome name={stat.icon} size={20} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          )
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{friendList.length} Friends</Text>
          <Pressable
            style={({ pressed }) => [styles.addFriendsBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/add-friends')}
          >
            <FontAwesome name="user-plus" size={12} color="#10B981" style={{ marginRight: 5 }} />
            <Text style={styles.addFriendsBtnText}>Add</Text>
          </Pressable>
        </View>
        {friendList.length === 0 ? (
          <View>
            <Text style={[styles.empty, { marginBottom: 12 }]}>No friends yet.</Text>
            <Pressable
              style={({ pressed }) => [styles.addFriendsCTA, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/add-friends')}
            >
              <FontAwesome name="user-plus" size={14} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addFriendsCTAText}>Add Friends from Contacts</Text>
            </Pressable>
          </View>
        ) : (
          friendList.map(friend => (
            <View key={friend.id} style={styles.friendRow}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>
                  {friend.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.friendName}>{friend.name}</Text>
                {friend.phone ? (
                  <Text style={styles.friendEmail}>
                    {friend.phone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '($2) $3-$4')}
                  </Text>
                ) : null}
              </View>
              <View style={styles.friendItemCount}>
                <Text style={styles.friendItemCountText}>
                  {items.filter(i => i.donorId === friend.id && (i.status === 'available' || i.status === 'claimed')).length} items
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Search Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome name="bell" size={15} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Search Alerts</Text>
        </View>
        {searchNotifications.length === 0 ? (
          <Text style={styles.empty}>
            No alerts yet. Search for an item and tap the{' '}
            <FontAwesome name="bell" size={12} color="#a0aec0" /> bell to get a text when one is posted.
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
                  <FontAwesome name="bell" size={13} color="#10B981" style={styles.alertIcon} />
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
                    <FontAwesome name="pencil" size={14} color="#718096" />
                  </Pressable>
                )}
                <Pressable
                  style={styles.alertIconBtn}
                  hitSlop={8}
                  onPress={() => deleteSearchNotification(notif.id)}
                >
                  <FontAwesome name="trash" size={14} color="#e53e3e" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        {[
          { icon: 'camera' as const, title: 'List Items', desc: 'Take photos and create listings for items you no longer need.' },
          { icon: 'search' as const, title: 'Browse', desc: 'See what your friends are giving away and claim what you want.' },
          { icon: 'clock-o' as const, title: 'Pick Up', desc: 'Coordinate pickup before the donor\'s disposal deadline.' },
          { icon: 'heart' as const, title: 'Give Back', desc: 'Unclaimed items go to the charity the donor chooses.' },
        ].map(tip => (
          <View key={tip.title} style={styles.tipRow}>
            <View style={styles.tipIcon}>
              <FontAwesome name={tip.icon} size={16} color="#10B981" />
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
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, backgroundColor: '#fff', gap: 4 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4a5568',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { fontSize: 22, fontWeight: '700', color: '#2d3748' },
  email: { fontSize: 14, color: '#718096' },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, maxWidth: 260 },
  addressText: { fontSize: 13, color: '#718096', flex: 1 },
  profileActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  editProfileBtnText: { fontSize: 13, color: '#10B981', fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoutBtnText: { fontSize: 13, color: '#718096', fontWeight: '600' },
  addFriendsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  addFriendsBtnText: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  addFriendsCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addFriendsCTAText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    margin: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardLink: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statCardPressed: { opacity: 0.7 },
  statChevron: { marginTop: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#2d3748', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#718096', marginTop: 2, textAlign: 'center' },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2d3748', marginBottom: 12 },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  alertIcon: { width: 18 },
  alertKeyword: { flex: 1, fontSize: 14, color: '#2d3748', fontWeight: '500' },
  alertEditInput: {
    flex: 1,
    fontSize: 14,
    color: '#2d3748',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ECFDF5',
  },
  alertActions: { flexDirection: 'row', gap: 12 },
  alertIconBtn: { padding: 4 },
  alertSaveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  alertSaveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty: { color: '#a0aec0', fontSize: 14 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: { fontSize: 14, fontWeight: '700', color: '#4a5568' },
  friendName: { fontSize: 14, fontWeight: '600', color: '#2d3748' },
  friendEmail: { fontSize: 12, color: '#718096' },
  friendItemCount: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  friendItemCountText: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#2d3748' },
  tipDesc: { fontSize: 13, color: '#718096', marginTop: 2 },
});
