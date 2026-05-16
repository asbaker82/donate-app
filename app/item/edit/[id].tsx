import React, { useState, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useApp } from '@/store/AppContext';
import { ItemCondition, DisposalMethod, DISPOSAL_METHOD_LABELS, CONDITION_LABELS } from '@/store/types';
import AddressInput from '@/components/AddressInput';
import DatePickerInput from '@/components/DatePickerInput';

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
  'goodwill', 'salvation_army', 'habitat', 'food_bank', 'other_charity', 'trash', 'keep',
];

type FieldKey = 'title' | 'pickupLocation' | 'pickupWindow' | 'disposalDate' | 'claimPickupHours';
type Errors = Partial<Record<FieldKey, string>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.errorRow}>
      <FontAwesome name="exclamation-circle" size={13} color="#e53e3e" style={{ marginRight: 5 }} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, updateItem } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const fieldOffsets = useRef<Partial<Record<FieldKey, number>>>({});

  const item = items.find(i => i.id === id);

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found.</Text>
      </View>
    );
  }

  // Parse ISO disposal date to YYYY-MM-DD for the picker
  const initialDisposalDate = item.disposalDate
    ? item.disposalDate.slice(0, 10)
    : '';

  const [photos, setPhotos] = useState<string[]>(item.photos);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [condition, setCondition] = useState<ItemCondition>(item.condition);
  const [restrictions, setRestrictions] = useState(item.restrictions ?? '');
  const [pickupLocation, setPickupLocation] = useState(item.pickupLocation);
  const [pickupWindow, setPickupWindow] = useState(item.pickupWindow);
  const [disposalDate, setDisposalDate] = useState(initialDisposalDate);
  const [disposalMethod, setDisposalMethod] = useState<DisposalMethod>(item.disposalMethod);
  const [disposalMethodNote, setDisposalMethodNote] = useState(item.disposalMethodNote ?? '');
  const [claimPickupHours, setClaimPickupHours] = useState(String(item.claimPickupHours));
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: FieldKey) => {
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

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

  const handleSubmit = () => {
    const next: Errors = {};

    if (!title.trim())
      next.title = 'Please enter a title for this item.';
    if (!pickupLocation.trim())
      next.pickupLocation = 'Please enter a pickup location.';
    if (!pickupWindow.trim())
      next.pickupWindow = 'Please describe when the item can be picked up.';
    if (!disposalDate.trim())
      next.disposalDate = 'Please choose a disposal date.';
    else if (isNaN(new Date(disposalDate).getTime()))
      next.disposalDate = 'That date doesn\'t look right — pick one from the calendar or type YYYY-MM-DD.';
    const hours = parseInt(claimPickupHours, 10);
    if (isNaN(hours) || hours < 1)
      next.claimPickupHours = 'Please enter a pickup window of at least 1 hour.';

    // Claim window must fit before the disposal deadline
    if (!next.disposalDate && !next.claimPickupHours && disposalDate && !isNaN(hours)) {
      const hoursUntilDisposal = (new Date(disposalDate).getTime() - Date.now()) / 3_600_000;
      if (hours >= hoursUntilDisposal) {
        next.claimPickupHours = `The pickup window (${hours}h) must be shorter than the time until disposal (~${Math.floor(hoursUntilDisposal)}h away). Shorten the pickup window or choose a later disposal date.`;
      }
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      const order: FieldKey[] = ['title', 'pickupLocation', 'pickupWindow', 'disposalDate', 'claimPickupHours'];
      const firstField = order.find(f => next[f]);
      if (firstField && fieldOffsets.current[firstField] !== undefined) {
        scrollRef.current?.scrollTo({ y: fieldOffsets.current[firstField]! - 20, animated: true });
      }
      return;
    }

    setSubmitting(true);
    updateItem(item.id, {
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
      claimPickupHours: hours,
    });
    router.back();
  };

  const trackOffset = (field: FieldKey) => ({
    onLayout: (e: any) => { fieldOffsets.current[field] = e.nativeEvent.layout.y; },
  });

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
          {photos.map((uri, i) => (
            <View key={i} style={styles.photoThumb}>
              <Image source={{ uri }} style={styles.photoImg} resizeMode="cover" />
              <Pressable style={styles.removePhoto} onPress={() => removePhoto(i)}>
                <FontAwesome name="times-circle" size={18} color="#e53e3e" />
              </Pressable>
            </View>
          ))}
          {photos.length < 6 && (
            <Pressable style={styles.addPhotoBtn} onPress={addPhoto}>
              <FontAwesome name="camera" size={24} color="#10B981" />
              <Text style={styles.addPhotoText}>
                {Platform.OS === 'web' ? 'Upload' : 'Add Photo'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
        <Text style={styles.hint}>Up to 6 photos</Text>
      </View>

      {/* Title */}
      <View style={styles.section} {...trackOffset('title')}>
        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          placeholder="e.g. IKEA KALLAX Bookshelf"
          placeholderTextColor="#a0aec0"
          value={title}
          onChangeText={t => { setTitle(t); clearError('title'); }}
        />
        <FieldError message={errors.title} />
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
      <View style={[styles.section, { zIndex: 10 }]} {...trackOffset('pickupLocation')}>
        <Text style={styles.label}>Pickup Location <Text style={styles.required}>*</Text></Text>
        <AddressInput
          value={pickupLocation}
          onChangeText={t => { setPickupLocation(t); clearError('pickupLocation'); }}
          placeholder="e.g. 123 Main St, Springfield"
          error={!!errors.pickupLocation}
        />
        <FieldError message={errors.pickupLocation} />
      </View>

      {/* Pickup Window */}
      <View style={styles.section} {...trackOffset('pickupWindow')}>
        <Text style={styles.label}>Pickup Availability <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.pickupWindow && styles.inputError]}
          placeholder="e.g. Weekends 10am–4pm, Evenings after 6pm"
          placeholderTextColor="#a0aec0"
          value={pickupWindow}
          onChangeText={t => { setPickupWindow(t); clearError('pickupWindow'); }}
        />
        <FieldError message={errors.pickupWindow} />
      </View>

      {/* Disposal Date */}
      <View style={[styles.section, { zIndex: 20 }]} {...trackOffset('disposalDate')}>
        <Text style={styles.label}>Disposal Date <Text style={styles.required}>*</Text></Text>
        <Text style={styles.hint}>If no one picks up the item by this date, it will be disposed of.</Text>
        <DatePickerInput
          value={disposalDate}
          onChange={d => { setDisposalDate(d); clearError('disposalDate'); }}
        />
        <FieldError message={errors.disposalDate} />
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
      <View style={styles.section} {...trackOffset('claimPickupHours')}>
        <Text style={styles.label}>Hours to pick up after claiming <Text style={styles.required}>*</Text></Text>
        <Text style={styles.hint}>How long does a donee have to arrange pickup before the next person on the waitlist is asked?</Text>
        <View style={styles.row}>
          {['24', '48', '72', '96'].map(h => (
            <Pressable
              key={h}
              style={[styles.chip, claimPickupHours === h && styles.chipActive]}
              onPress={() => { setClaimPickupHours(h); clearError('claimPickupHours'); }}
            >
              <Text style={[styles.chipText, claimPickupHours === h && styles.chipTextActive]}>
                {h}h
              </Text>
            </Pressable>
          ))}
          <TextInput
            style={[styles.input, styles.hoursInput, errors.claimPickupHours && styles.inputError]}
            placeholder="Custom"
            placeholderTextColor="#a0aec0"
            value={['24', '48', '72', '96'].includes(claimPickupHours) ? '' : claimPickupHours}
            onChangeText={t => { setClaimPickupHours(t); clearError('claimPickupHours'); }}
            keyboardType="numeric"
          />
        </View>
        <FieldError message={errors.claimPickupHours} />
      </View>

      {/* Save */}
      <Pressable
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <FontAwesome name="check" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.submitBtnText}>Save Changes</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: '#718096' },
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
  inputError: {
    borderColor: '#fc8181',
    backgroundColor: '#fff5f5',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#e53e3e',
    flex: 1,
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
    borderColor: '#10B981',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoText: { fontSize: 12, color: '#10B981', fontWeight: '600' },
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
  chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  chipText: { fontSize: 13, color: '#4a5568', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
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
