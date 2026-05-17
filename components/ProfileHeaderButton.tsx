import React from 'react';
import { Pressable, Image, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/AuthContext';
import { useApp } from '@/store/AppContext';

export default function ProfileHeaderButton() {
  const router = useRouter();
  const { authUser } = useAuth();
  const { currentUser } = useApp();
  const user = authUser ?? currentUser;

  const initials = user.name?.trim()
    ? user.name.trim().split(/\s+/).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
      onPress={() => router.push('/(tabs)/profile')}
      accessibilityLabel="Profile"
      accessibilityRole="button"
    >
      {user.profilePhoto ? (
        <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { marginRight: 14 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F26B3A',
  },
  fallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3EC',
    borderWidth: 2,
    borderColor: '#F26B3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 15, fontWeight: '800', color: '#F26B3A' },
});
