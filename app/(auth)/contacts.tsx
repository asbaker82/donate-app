import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/store/AuthContext';
import { useApp } from '@/store/AppContext';
import { User } from '@/store/types';
import { MOCK_USERS } from '@/store/mockData';

export default function ContactsScreen() {
  const router = useRouter();
  const { authUser, updateAuthUser } = useAuth();
  const { users } = useApp();
  const [suggested, setSuggested] = useState<User[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    if (!authUser) { setLoading(false); return; }

    if (Platform.OS === 'web') {
      // On web, show all mock users except self
      const suggestions = MOCK_USERS.filter(u => u.id !== authUser.id);
      setSuggested(suggestions);
      setLoading(false);
      return;
    }

    try {
      const Contacts = await import('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setSuggested(MOCK_USERS.filter(u => u.id !== authUser.id));
        setLoading(false);
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const contactPhones = new Set<string>();
      for (const c of data) {
        for (const p of c.phoneNumbers ?? []) {
          const digits = (p.number ?? '').replace(/\D/g, '');
          if (digits.length === 10) contactPhones.add(`+1${digits}`);
          if (digits.length === 11 && digits.startsWith('1')) contactPhones.add(`+${digits}`);
        }
      }

      const matched = users.filter(
        u => u.id !== authUser.id && u.phone && contactPhones.has(u.phone)
      );
      setSuggested(matched.length > 0 ? matched : MOCK_USERS.filter(u => u.id !== authUser.id));
    } catch {
      setSuggested(MOCK_USERS.filter(u => u.id !== authUser.id));
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

  const handleDone = async () => {
    if (added.size > 0 && authUser) {
      const existing = new Set(authUser.friends);
      added.forEach(id => existing.add(id));
      await updateAuthUser({ friends: Array.from(existing) });
    }
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>👥</Text>
        </View>
        <Text style={styles.title}>Find your friends</Text>
        <Text style={styles.subtitle}>
          {Platform.OS === 'web'
            ? 'People already on Donate App:'
            : 'Your contacts who are already on Donate App:'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
      ) : suggested.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="users" size={40} color="#e2e8f0" />
          <Text style={styles.emptyTitle}>None of your contacts are on Donate App yet</Text>
          <Text style={styles.emptySubtitle}>You can add friends later from your profile.</Text>
        </View>
      ) : (
        <FlatList
          data={suggested}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isAdded = added.has(item.id);
            return (
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name.split(' ').map(n => n[0]).join('')}
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
                  <FontAwesome
                    name={isAdded ? 'check' : 'plus'}
                    size={14}
                    color={isAdded ? '#fff' : '#10B981'}
                  />
                  <Text style={[styles.addBtnText, isAdded && styles.addBtnTextAdded]}>
                    {isAdded ? 'Added' : 'Add'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}

      <View style={styles.actions}>
        {added.size > 0 && (
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && styles.btnPressed]}
            onPress={handleDone}
          >
            <Text style={styles.doneBtnText}>Add {added.size} Friend{added.size !== 1 ? 's' : ''} & Continue</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
          onPress={handleSkip}
        >
          <Text style={styles.skipBtnText}>
            {added.size > 0 ? 'Skip for Now' : 'Skip, Add Friends Later'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: '800', color: '#2d3748', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#718096', textAlign: 'center', marginTop: 6 },
  list: { paddingHorizontal: 20, paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  addBtnAdded: { backgroundColor: '#10B981', borderColor: '#10B981' },
  addBtnPressed: { opacity: 0.75 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  addBtnTextAdded: { color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#4a5568', textAlign: 'center', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#a0aec0', textAlign: 'center', marginTop: 8 },
  actions: { padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  doneBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  skipBtn: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: { fontSize: 15, fontWeight: '600', color: '#718096' },
  btnPressed: { opacity: 0.75 },
});
