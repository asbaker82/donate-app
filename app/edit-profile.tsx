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
import ImageCropModal from '@/components/ImageCropModal';
import { ItemVisibility } from '@/store/types';



async function pickImage(): Promise<string | null> {
  // On web, use a file input directly — expo-image-picker permissions are unreliable in browsers.
  if (Platform.OS === 'web') {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }

  try {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return null;
    return result.assets[0].uri;
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
  const [cropUri, setCropUri] = useState<string | null>(null);

  const initials = name.trim()
    ? name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handlePickPhoto = async () => {
    setPickingPhoto(true);
    const uri = await pickImage();
    setPickingPhoto(false);
    if (!uri) return;
    if (Platform.OS === 'web') {
      // Show crop modal on web; native expo-image-picker already crops
      setCropUri(uri);
    } else {
      setProfilePhoto(uri);
    }
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
    <View style={{ flex: 1 }}>
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
          placeholderTextColor={MUTE}
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
          placeholderTextColor={MUTE}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Mobile Number</Text>
        <View style={styles.readonlyRow}>
          <FontAwesome name="lock" size={13} color={MUTE} style={{ marginRight: 8 }} />
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
            <FontAwesome name="times-circle" size={13} color={MUTE} style={{ marginRight: 5 }} />
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

    {cropUri && (
      <ImageCropModal
        imageUri={cropUri}
        visible={!!cropUri}
        onConfirm={dataUrl => { setProfilePhoto(dataUrl); setCropUri(null); }}
        onCancel={() => setCropUri(null)}
      />
    )}
    </View>
  );
}

const TANGERINE  = '#F26B3A';
const TANG_DEEP  = '#D8531F';
const CREAM      = '#FBF6EE';
const CREAM_2    = '#F4ECDD';
const INK        = '#1F1A17';
const INK_2      = '#3A332E';
const MUTE       = '#847A70';
const DIVIDER    = 'rgba(31,26,23,0.08)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  content: { paddingBottom: 48 },

  photoSection: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
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
    backgroundColor: CREAM_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 34, fontWeight: '800', color: INK_2 },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: TANGERINE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoHint: { fontSize: 13, color: MUTE },
  removePhotoBtn: { marginTop: 8 },
  removePhotoText: { fontSize: 13, color: TANG_DEEP },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 20,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: INK, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: MUTE, marginBottom: 14, lineHeight: 18 },

  label: { fontSize: 13, fontWeight: '600', color: INK_2, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: DIVIDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: INK,
    backgroundColor: CREAM,
  },
  inputError: { borderColor: TANG_DEEP },
  errorText: { color: TANG_DEEP, fontSize: 12, marginTop: 4 },

  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: DIVIDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: CREAM_2,
  },
  readonlyText: { fontSize: 15, color: MUTE },
  readonlyHint: { fontSize: 12, color: MUTE, marginTop: 5, opacity: 0.7 },

  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: DIVIDER,
    marginBottom: 10,
    backgroundColor: CREAM,
  },
  visibilityOptionSelected: {
    borderColor: TANGERINE,
    backgroundColor: '#FFF3EE',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: DIVIDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  radioSelected: { borderColor: TANGERINE },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: TANGERINE,
  },
  visibilityLabel: { fontSize: 14, fontWeight: '600', color: INK_2 },
  visibilityLabelSelected: { color: TANGERINE },
  visibilityDesc: { fontSize: 12, color: MUTE, marginTop: 3, lineHeight: 17 },
  clearAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  clearAddressText: { fontSize: 13, color: MUTE },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TANGERINE,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 999,
    height: 52,
  },
  saveBtnPressed: { opacity: 0.85 },
  saveBtnDisabled: { backgroundColor: MUTE },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: CREAM },
});
