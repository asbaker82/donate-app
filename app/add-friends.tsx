import React, { useState, useEffect } from 'react';
import {
  View, Text, SectionList, Pressable, StyleSheet,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/store/AuthContext';
import { useApp } from '@/store/AppContext';
import { User } from '@/store/types';
import { MOCK_USERS } from '@/store/mockData';

type Section = { title: string; subtitle?: string; data: User[] };

export default function AddFriendsScreen() {
  const router = useRouter();
  const { authUser, updateAuthUser } = useAuth();
  const { users } = useApp();
  const [sections, setSections] = useState<Section[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [contactsPermission, setContactsPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    buildSections();
  }, []);

  async function buildSections() {
    if (!authUser) { setLoading(false); return; }
    const existingFriends = new Set(authUser.friends);
    const allCandidates = MOCK_USERS.filter(u => u.id !== authUser.id && !existingFriends.has(u.id));

    if (Platform.OS === 'web') {
      // Web: can't read contacts — show all app users
      setSections([
        {
          title: 'People on Yoink It',
          subtitle: 'Add contacts on your phone to see who\'s already here.',
          data: allCandidates,
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const Contacts = await import('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      setContactsPermission(status === 'granted' ? 'granted' : 'denied');

      if (status !== 'granted') {
        setSections([{
          title: 'People on Yoink It',
          subtitle: 'Allow contact access in Settings to see which friends are already here.',
          data: allCandidates,
        }]);
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      const contactPhones = new Set<string>();
      for (const c of data) {
        for (const p of c.phoneNumbers ?? []) {
          const digits = (p.number ?? '').replace(/\D/g, '');
          if (digits.length === 10) contactPhones.add(`+1${digits}`);
          if (digits.length === 11 && digits.startsWith('1')) contactPhones.add(`+${digits}`);
        }
      }

      const fromContacts = allCandidates.filter(u => u.phone && contactPhones.has(u.phone));
      const others       = allCandidates.filter(u => !u.phone || !contactPhones.has(u.phone));

      const built: Section[] = [];
      if (fromContacts.length > 0) {
        built.push({
          title: 'From Your Contacts',
          subtitle: 'These people are in your phone\'s contacts and already on Yoink It.',
          data: fromContacts,
        });
      }
      if (others.length > 0) {
        built.push({
          title: 'Others on Yoink It',
          subtitle: fromContacts.length > 0 ? 'Other app users not in your contacts.' : undefined,
          data: others,
        });
      }
      if (built.length === 0) {
        built.push({ title: 'No suggestions', data: [] });
      }
      setSections(built);
    } catch {
      setSections([{ title: 'People on Yoink It', data: allCandidates }]);
    } finally {
      setLoading(false);
    }
  }

  const toggleFriend = (userId: string) => {
    setAdded(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSave = async () => {
    if (added.size > 0 && authUser) {
      const existing = new Set(authUser.friends);
      added.forEach(id => existing.add(id));
      await updateAuthUser({ friends: Array.from(existing) });
    }
    router.back();
  };

  const allUsers = sections.flatMap(s => s.data);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>
            {Platform.OS !== 'web' ? 'Reading your contacts…' : 'Loading…'}
          </Text>
        </View>
      ) : allUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="users" size={40} color="#e2e8f0" />
          <Text style={styles.emptyTitle}>No new friends to add</Text>
          <Text style={styles.emptySubtitle}>
            {contactsPermission === 'denied'
              ? 'Allow contact access in Settings so we can find your friends.'
              : 'Invite your friends to join Yoink It!'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.subtitle ? (
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              ) : null}
            </View>
          )}
          renderItem={({ item }) => {
            const isAdded = added.has(item.id);
            return (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name.split(' ').map((n: string) => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.phone && (
                    <Text style={styles.phone}>
                      {item.phone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4')}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.addBtn,
                    isAdded && styles.addBtnAdded,
                    pressed && styles.addBtnPressed,
                  ]}
                  onPress={() => toggleFriend(item.id)}
                >
                  <FontAwesome name={isAdded ? 'check' : 'plus'} size={14} color={isAdded ? '#fff' : '#10B981'} />
                  <Text style={[styles.addBtnText, isAdded && styles.addBtnTextAdded]}>
                    {isAdded ? 'Added' : 'Add'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && styles.btnPressed]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>
            {added.size > 0 ? `Add ${added.size} Friend${added.size !== 1 ? 's' : ''}` : 'Done'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#718096' },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a0aec0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 3,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#4a5568' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#2d3748' },
  phone: { fontSize: 13, color: '#718096', marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  addBtnAdded: { backgroundColor: '#10B981', borderColor: '#10B981' },
  addBtnPressed: { opacity: 0.75 },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  addBtnTextAdded: { color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#4a5568', textAlign: 'center', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#a0aec0', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  btnPressed: { opacity: 0.75 },
});
