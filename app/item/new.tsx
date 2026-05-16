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
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useApp } from '@/store/AppContext';
import { ItemCondition, DisposalMethod, DISPOSAL_METHOD_LABELS, CONDITION_LABELS } from '@/store/types';
import AddressInput from '@/components/AddressInput';

async function pickImageWeb(): Promise<string | null> {
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

const CONDITIONS: ItemCondition[] = ['excellent', 'good', 'fair', 'poor'];
const DISPOSAL_METHODS: DisposalMethod[] = [
  'goodwill',
  'salvation_army',
  'habitat',
  'food_bank',
  'other_charity',
  'trash',
  'keep',
];

export default function NewItemScreen() {
  const router = useRouter();
  const { createItem } = useApp();

  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('good');
  const [restrictions, setRestrictions] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupWindow, setPickupWindow] = useState('');
  const [disposalDate, setDisposalDate] = useState('');
  const [disposalMethod, setDisposalMethod] = useState<DisposalMethod>('goodwill');
  const [disposalMethodNote, setDisposalMethodNote] = useState('');
  const [claimPickupHours, setClaimPickupHours] = useState('72');
  const [submitting, setSubmitting] = useState(false);

  const addPhoto = async () => {
    if (Platform.OS === 'web') {
      const uri = await pickImageWeb();
      if (uri) setPhotos(prev => [...prev, uri]);
    } else {
      Alert.alert('Camera', 'On a device, this would open the camera or photo library.');
    }
  };

  const removePhoto = (index: number) =>
    setPhotos(prev => prev.filter((_, i) => i !== index));

  const validate = () => {
    if (!title.trim()) return 'Title is required.';
    if (!pickupLocation.trim()) return 'Pickup location is required.';
    if (!pickupWindow.trim()) return 'Pickup availability is required.';
    if (!disposalDate.trim()) return 'Disposal date is required.';
    const parsed = new Date(disposalDate);
    if (isNaN(parsed.getTime())) return 'Enter a valid date (e.g. 2025-06-15).';
    const hours = parseInt(claimPickupHours, 10);
    if (isNaN(hours) || hours < 1) return 'Claim pickup hours must be at least 1.';
    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) {
      Alert.alert('Missing Info', error);
      return;
    }
    setSubmitting(true);
    createItem({
      title: title.trim(),
      description: description.trim(),
      photos,
      condition,
      restrictions: restrictions.trim() || undefined,
      pickupLocation: pickupLocation.trim(),
      pickupWindow: pickupWindow.trim(),
      disposalDate: new Date(disposalDate).toISOString(),
      disposalMethod,
      disposalMethodNote: disposalMethodNote.trim() || undefined,
      claimPickupHours: parseInt(claimPickupHours, 10),
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
          {photos.map((uri, i) => (
            <View key={i} style={styles.photoThumb}>
              <Image source={{ uri }} style={styles.photoImg} />
              <Pressable style={styles.removePhoto} onPress={() => removePhoto(i)}>
                <FontAwesome name="times-circle" size={18} color="#e53e3e" />
              </Pressable>
            </View>
          ))}
          {photos.length < 6 && (
            <Pressable style={styles.addPhotoBtn} onPress={addPhoto}>
              <FontAwesome name="camera" size={24} color="#2E8B57" />
              <Text style={styles.addPhotoText}>
                {Platform.OS === 'web' ? 'Upload' : 'Add Photo'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
        <Text style={styles.hint}>Up to 6 photos</Text>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. IKEA KALLAX Bookshelf"
          placeholderTextColor="#a0aec0"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the item — dimensions, any wear, what's included…"
          placeholderTextColor="#a0aec0"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Condition */}
      <View style={styles.section}>
        <Text style={styles.label}>Condition <Text style={styles.required}>*</Text></Text>
        <View style={styles.chipRow}>
          {CONDITIONS.map(c => (
            <Pressable
              key={c}
              style={[styles.chip, condition === c && styles.chipActive]}
              onPress={() => setCondition(c)}
            >
              <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>
                {CONDITION_LABELS[c]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Restrictions */}
      <View style={styles.section}>
        <Text style={styles.label}>Restrictions <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Foster care placements only, pregnant friends only"
          placeholderTextColor="#a0aec0"
          value={restrictions}
          onChangeText={setRestrictions}
        />
      </View>

      {/* Pickup Location */}
      <View style={[styles.section, { zIndex: 10 }]}>
        <Text style={styles.label}>Pickup Location <Text style={styles.required}>*</Text></Text>
        <AddressInput
          value={pickupLocation}
          onChangeText={setPickupLocation}
          placeholder="e.g. 123 Main St, Springfield"
        />
      </View>

      {/* Pickup Window */}
      <View style={styles.section}>
        <Text style={styles.label}>Pickup Availability <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Weekends 10am–4pm, Evenings after 6pm"
          placeholderTextColor="#a0aec0"
          value={pickupWindow}
          onChangeText={setPickupWindow}
        />
      </View>

      {/* Disposal Date */}
      <View style={styles.section}>
        <Text style={styles.label}>Disposal Date <Text style={styles.required}>*</Text></Text>
        <Text style={styles.hint}>If no one picks up the item by this date, it will be disposed of.</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD  (e.g. 2025-06-15)"
          placeholderTextColor="#a0aec0"
          value={disposalDate}
          onChangeText={setDisposalDate}
        />
      </View>

      {/* Disposal Method */}
      <View style={styles.section}>
        <Text style={styles.label}>If unclaimed, goes to… <Text style={styles.required}>*</Text></Text>
        <View style={styles.chipRow}>
          {DISPOSAL_METHODS.map(m => (
            <Pressable
              key={m}
              style={[styles.chip, disposalMethod === m && styles.chipActive]}
              onPress={() => setDisposalMethod(m)}
            >
              <Text style={[styles.chipText, disposalMethod === m && styles.chipTextActive]}>
                {DISPOSAL_METHOD_LABELS[m]}
              </Text>
            </Pressable>
          ))}
        </View>
        {disposalMethod === 'other_charity' && (
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Specify the charity…"
            placeholderTextColor="#a0aec0"
            value={disposalMethodNote}
            onChangeText={setDisposalMethodNote}
          />
        )}
      </View>

      {/* Claim Pickup Hours */}
      <View style={styles.section}>
        <Text style={styles.label}>Hours to pick up after claiming <Text style={styles.required}>*</Text></Text>
        <Text style={styles.hint}>How long does a donee have to arrange pickup before the next person on the waitlist is asked?</Text>
        <View style={styles.row}>
          {['24', '48', '72', '96'].map(h => (
            <Pressable
              key={h}
              style={[styles.chip, claimPickupHours === h && styles.chipActive]}
              onPress={() => setClaimPickupHours(h)}
            >
              <Text style={[styles.chipText, claimPickupHours === h && styles.chipTextActive]}>
                {h}h
              </Text>
            </Pressable>
          ))}
          <TextInput
            style={[styles.input, styles.hoursInput]}
            placeholder="Custom"
            placeholderTextColor="#a0aec0"
            value={['24', '48', '72', '96'].includes(claimPickupHours) ? '' : claimPickupHours}
            onChangeText={setClaimPickupHours}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Submit */}
      <Pressable
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <FontAwesome name="check" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.submitBtnText}>Create Listing</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2d3748', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: '#2d3748', marginBottom: 6 },
  required: { color: '#e53e3e' },
  optional: { color: '#a0aec0', fontWeight: '400', fontSize: 13 },
  hint: { fontSize: 12, color: '#a0aec0', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2d3748',
    backgroundColor: '#fafafa',
  },
  textArea: { minHeight: 100, paddingTop: 10 },
  hoursInput: { flex: 1, minWidth: 70 },
  photoRow: { flexDirection: 'row', marginBottom: 4 },
  photoThumb: { position: 'relative', marginRight: 10 },
  photoImg: { width: 90, height: 90, borderRadius: 10 },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addPhotoBtn: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2E8B57',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoText: { fontSize: 12, color: '#2E8B57', fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f7fafc',
  },
  chipActive: { backgroundColor: '#2E8B57', borderColor: '#2E8B57' },
  chipText: { fontSize: 13, color: '#4a5568', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E8B57',
    margin: 16,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
