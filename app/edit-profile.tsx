import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/store/AuthContext';
import { useApp } from '@/store/AppContext';
import AddressInput from '@/components/AddressInput';
import { ItemVisibility } from '@/store/types';

// Compress a data URL to ~15 KB so it fits in localStorage on web.
async function compressDataUrl(dataUrl: string, maxDim = 180, quality = 0.55): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Convert a blob/object URL to a data URL, then compress.
async function blobUrlToCompressedDataUrl(uri: string): Promise<string> {
  const resp = await fetch(uri);
  const blob = await resp.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = async () => {
      resolve(await compressDataUrl(reader.result as string));
    };
    reader.readAsDataURL(blob);
  });
}

async function pickImage(): Promise<string | null> {
  try {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS !== 'web') {
        Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.');
      }
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return null;
    const uri = result.assets[0].uri;
    // On web the URI is a blob URL — convert and compress for localStorage.
    if (Platform.OS === 'web') {
      return await blobUrlToCompressedDataUrl(uri);
    }
    return uri;
  } catch {
    return null;
  }
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { authUser, updateAuthUser } = useAuth();
  const { currentUser } = useApp();

  const user = authUser ?? currentUser;

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? '');
  const [defaultAddress, setDefaultAddress] = useState(user.defaultAddress ?? '');
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto ?? '');
  const [itemVisibility, setItemVisibility] = useState<ItemVisibility>(user.itemVisibility ?? 'added');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const initials = name.trim()
    ? name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handlePickPhoto = async () => {
    setPickingPhoto(true);
    const uri = await pickImage();
    setPickingPhoto(false);
    if (uri) setProfilePhoto(uri);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto('');
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (trimmedName.split(/\s+/).filter(Boolean).length < 2) {
      setNameError('Please enter your first and last name.');
      return;
    }
    setNameError('');
    setSaving(true);
    await updateAuthUser({
      name: trimmedName,
      email: email.trim(),
      defaultAddress: defaultAddress.trim() || undefined,
      profilePhoto: profilePhoto || undefined,
      itemVisibility,
    });
    setSaving(false);
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Profile photo */}
      <View style={styles.photoSection}>
        <Pressable style={styles.avatarWrap} onPress={handlePickPhoto} disabled={pickingPhoto}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              {pickingPhoto
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.avatarInitials}>{initials}</Text>
              }
            </View>
          )}
          <View style={styles.cameraOverlay}>
            {pickingPhoto
              ? <ActivityIndicator size="small" color="#fff" />
              : <FontAwesome name="camera" size={16} color="#fff" />
            }
          </View>
        </Pressable>
        <Text style={styles.photoHint}>Tap to change photo</Text>
        {profilePhoto ? (
          <Pressable onPress={handleRemovePhoto} style={styles.removePhotoBtn}>
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Name */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Info</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : null]}
          value={name}
          onChangeText={t => { setName(t); if (nameError) setNameError(''); }}
          placeholder="First Last"
          placeholderTextColor="#a0aec0"
          autoCapitalize="words"
          returnKeyType="next"
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <Text style={[styles.label, { marginTop: 16 }]}>Email (optional)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#a0aec0"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Mobile Number</Text>
        <View style={styles.readonlyRow}>
          <FontAwesome name="lock" size={13} color="#a0aec0" style={{ marginRight: 8 }} />
          <Text style={styles.readonlyText}>
            {user.phone
              ? user.phone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4')
              : 'No phone on file'}
          </Text>
        </View>
        <Text style={styles.readonlyHint}>Phone number cannot be changed here.</Text>
      </View>

      {/* Default address */}
      <View style={[styles.card, { zIndex: 10 }]}>
        <Text style={styles.sectionTitle}>Default Pickup Address</Text>
        <Text style={styles.sectionSubtitle}>
          This address will pre-fill the pickup location when you create a new listing.
        </Text>
        <View style={{ zIndex: 10 }}>
          <AddressInput
            value={defaultAddress}
            onChangeText={setDefaultAddress}
            placeholder="Start typing your address…"
          />
        </View>
        {defaultAddress ? (
          <Pressable onPress={() => setDefaultAddress('')} style={styles.clearAddressBtn}>
            <FontAwesome name="times-circle" size={13} color="#a0aec0" style={{ marginRight: 5 }} />
            <Text style={styles.clearAddressText}>Clear address</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Listing visibility */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Who Can See My Listings</Text>
        <Text style={styles.sectionSubtitle}>
          Control which friends can browse items you post.
        </Text>

        {([
          {
            value: 'added' as ItemVisibility,
            label: 'Friends I\'ve added',
            desc: 'Only people you have personally added as friends.',
          },
          {
            value: 'both' as ItemVisibility,
            label: 'Friends I\'ve added + people who\'ve added me',
            desc: 'Anyone with a mutual connection — you added them, or they added you.',
          },
        ] as { value: ItemVisibility; label: string; desc: string }[]).map(opt => (
          <Pressable
            key={opt.value}
            style={({ pressed }) => [
              styles.visibilityOption,
              itemVisibility === opt.value && styles.visibilityOptionSelected,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setItemVisibility(opt.value)}
          >
            <View style={[styles.radio, itemVisibility === opt.value && styles.radioSelected]}>
              {itemVisibility === opt.value && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.visibilityLabel, itemVisibility === opt.value && styles.visibilityLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.visibilityDesc}>{opt.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Save button */}
      <Pressable
        style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <>
              <FontAwesome name="check" size={15} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
        }
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 48 },

  photoSection: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 10,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 34, fontWeight: '800', color: '#fff' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4a5568',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoHint: { fontSize: 13, color: '#718096' },
  removePhotoBtn: { marginTop: 8 },
  removePhotoText: { fontSize: 13, color: '#e53e3e' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2d3748', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#718096', marginBottom: 14, lineHeight: 18 },

  label: { fontSize: 13, fontWeight: '600', color: '#4a5568', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2d3748',
    backgroundColor: '#f7fafc',
  },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 12, marginTop: 4 },

  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  readonlyText: { fontSize: 15, color: '#718096' },
  readonlyHint: { fontSize: 12, color: '#a0aec0', marginTop: 5 },

  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    backgroundColor: '#f7fafc',
  },
  visibilityOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  radioSelected: { borderColor: '#10B981' },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  visibilityLabel: { fontSize: 14, fontWeight: '600', color: '#4a5568' },
  visibilityLabelSelected: { color: '#10B981' },
  visibilityDesc: { fontSize: 12, color: '#718096', marginTop: 3, lineHeight: 17 },
  clearAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  clearAddressText: { fontSize: 13, color: '#a0aec0' },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    height: 52,
  },
  saveBtnPressed: { opacity: 0.85 },
  saveBtnDisabled: { backgroundColor: '#a0aec0' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
