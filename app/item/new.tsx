import React, { useState, useRef, useEffect } from 'react';
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
import { ItemCondition, DisposalMethod, DISPOSAL_METHOD_LABELS, CONDITION_LABELS, ListingType, BlockedPeriod } from '@/store/types';
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

export default function NewItemScreen() {
  const router = useRouter();
  const { createItem, currentUser } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const fieldOffsets = useRef<Partial<Record<FieldKey, number>>>({});

  const [listingType, setListingType] = useState<ListingType>('give');
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('good');
  const [restrictions, setRestrictions] = useState('');
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [blockedStart, setBlockedStart] = useState('');
  const [blockedEnd, setBlockedEnd] = useState('');
  const [pickupLocation, setPickupLocation] = useState(currentUser.defaultAddress ?? '');

  // Fill in default address once profile is available (handles async profile load)
  useEffect(() => {
    if (currentUser.defaultAddress && !pickupLocation) {
      setPickupLocation(currentUser.defaultAddress);
    }
  }, [currentUser.defaultAddress]);
  const [pickupWindow, setPickupWindow] = useState('');
  const [disposalDate, setDisposalDate] = useState('');
  const [disposalMethod, setDisposalMethod] = useState<DisposalMethod>('goodwill');
  const [disposalMethodNote, setDisposalMethodNote] = useState('');
  const [claimPickupHours, setClaimPickupHours] = useState('72');
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

  const addBlockedPeriod = () => {
    if (!blockedStart || !blockedEnd) return;
    if (blockedEnd < blockedStart) return;
    setBlockedPeriods(prev => [...prev, { start: blockedStart, end: blockedEnd }]);
    setBlockedStart('');
    setBlockedEnd('');
  };

  const handleSubmit = () => {
    const next: Errors = {};

    if (!title.trim())
      next.title = 'Please enter a title for this item.';
    if (!pickupLocation.trim())
      next.pickupLocation = 'Please enter a pickup location.';
    if (!pickupWindow.trim())
      next.pickupWindow = 'Please describe when the item can be picked up.';

    if (listingType === 'give') {
      if (!disposalDate.trim())
        next.disposalDate = 'Please choose a disposal date.';
      else if (isNaN(new Date(disposalDate).getTime()))
        next.disposalDate = 'That date doesn\'t look right — pick one from the calendar or type MM-DD-YYYY.';
      const hours = parseInt(claimPickupHours, 10);
      if (isNaN(hours) || hours < 1)
        next.claimPickupHours = 'Please enter a pickup window of at least 1 hour.';
      if (!next.disposalDate && !next.claimPickupHours && disposalDate && !isNaN(hours)) {
        const hoursUntilDisposal = (new Date(disposalDate).getTime() - Date.now()) / 3_600_000;
        if (hours >= hoursUntilDisposal) {
          next.claimPickupHours = `The pickup window (${hours}h) must be shorter than the time until disposal (~${Math.floor(hoursUntilDisposal)}h away). Shorten the pickup window or choose a later disposal date.`;
        }
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

    const hours = parseInt(claimPickupHours, 10);
    setSubmitting(true);
    createItem({
      title: title.trim(),
      description: description.trim(),
      photos,
      condition,
      restrictions: restrictions.trim() || undefined,
      pickupLocation: pickupLocation.trim(),
      pickupWindow: pickupWindow.trim(),
      disposalDate: listingType === 'give' ? new Date(disposalDate).toISOString() : '2099-12-31T00:00:00.000Z',
      disposalMethod: listingType === 'give' ? disposalMethod : 'keep',
      disposalMethodNote: listingType === 'give' ? (disposalMethodNote.trim() || undefined) : undefined,
      claimPickupHours: listingType === 'give' ? hours : 0,
      listingType,
      blockedPeriods,
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
      {/* Listing type */}
      <View style={styles.typeToggleSection}>
        <Text style={styles.typeToggleLabel}>What are you doing with this item?</Text>
        <View style={styles.typeToggleRow}>
          <Pressable
            style={[styles.typeBtn, listingType === 'give' && styles.typeBtnActive]}
            onPress={() => setListingType('give')}
          >
            <FontAwesome name="gift" size={18} color={listingType === 'give' ? CREAM : MUTE} />
            <Text style={[styles.typeBtnText, listingType === 'give' && styles.typeBtnTextActive]}>Give Away</Text>
            <Text style={[styles.typeBtnSub, listingType === 'give' && { color: 'rgba(251,246,238,0.75)' }]}>Keep it forever</Text>
          </Pressable>
          <Pressable
            style={[styles.typeBtn, listingType === 'borrow' && styles.typeBtnActiveBorrow]}
            onPress={() => setListingType('borrow')}
          >
            <FontAwesome name="refresh" size={18} color={listingType === 'borrow' ? CREAM : MUTE} />
            <Text style={[styles.typeBtnText, listingType === 'borrow' && styles.typeBtnTextActive]}>Lend Out</Text>
            <Text style={[styles.typeBtnSub, listingType === 'borrow' && { color: 'rgba(251,246,238,0.75)' }]}>Borrow & return</Text>
          </Pressable>
        </View>
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoRow}>
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
              <FontAwesome name="camera" size={24} color="#F26B3A" />
              <Text style={styles.addPhotoText}>
                {Platform.OS === 'web' ? 'Upload' : 'Add Photo'}
              </Text>
            </Pressable>
          )}
        </View>
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

      {/* Give Away: Disposal Date */}
      {listingType === 'give' && (
        <View style={[styles.section, { zIndex: 20 }]} {...trackOffset('disposalDate')}>
          <Text style={styles.label}>Disposal Date <Text style={styles.required}>*</Text></Text>
          <Text style={styles.hint}>If no one picks up the item by this date, it will be disposed of.</Text>
          <DatePickerInput
            value={disposalDate}
            onChange={d => { setDisposalDate(d); clearError('disposalDate'); }}
          />
          <FieldError message={errors.disposalDate} />
        </View>
      )}

      {/* Give Away: Disposal Method */}
      {listingType === 'give' && (
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
      )}

      {/* Give Away: Claim Pickup Hours */}
      {listingType === 'give' && (
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
      )}

      {/* Borrow: Blocked Periods */}
      {listingType === 'borrow' && (
        <View style={[styles.section, { zIndex: 20 }]}>
          <Text style={styles.label}>Block Out Dates <Text style={styles.optional}>(optional)</Text></Text>
          <Text style={styles.hint}>Add periods when this item is unavailable — e.g. vacations, scheduled use.</Text>
          {blockedPeriods.map((p, i) => (
            <View key={i} style={styles.blockedPeriodRow}>
              <FontAwesome name="ban" size={12} color={MUTE} style={{ marginRight: 6 }} />
              <Text style={styles.blockedPeriodText}>
                {new Date(p.start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(p.end + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Pressable onPress={() => setBlockedPeriods(prev => prev.filter((_, j) => j !== i))} style={{ marginLeft: 'auto' }}>
                <FontAwesome name="times" size={14} color={MUTE} />
              </Pressable>
            </View>
          ))}
          <Text style={[styles.hint, { marginTop: 10 }]}>Start date</Text>
          <DatePickerInput value={blockedStart} onChange={setBlockedStart} />
          {blockedStart && (
            <>
              <Text style={[styles.hint, { marginTop: 10 }]}>End date</Text>
              <DatePickerInput value={blockedEnd} onChange={setBlockedEnd} />
            </>
          )}
          {blockedStart && blockedEnd && (
            <Pressable style={styles.addPeriodBtn} onPress={addBlockedPeriod}>
              <FontAwesome name="plus" size={13} color={CREAM} style={{ marginRight: 6 }} />
              <Text style={styles.addPeriodBtnText}>Add Blocked Period</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Submit */}
      <Pressable
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <FontAwesome name="check" size={16} color="#FBF6EE" style={{ marginRight: 8 }} />
        <Text style={styles.submitBtnText}>Create Listing</Text>
      </Pressable>
    </ScrollView>
  );
}

const TANGERINE = '#F26B3A';
const CREAM     = '#FBF6EE';
const CREAM_2   = '#F4ECDD';
const INK       = '#1F1A17';
const MUTE      = '#847A70';
const BORDER    = 'rgba(31,26,23,0.12)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  content: { paddingBottom: 40 },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: INK, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: INK, marginBottom: 6 },
  required: { color: '#e53e3e' },
  optional: { color: MUTE, fontWeight: '400', fontSize: 13 },
  hint: { fontSize: 12, color: MUTE, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: INK,
    backgroundColor: CREAM,
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
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  photoThumb: { position: 'relative' },
  photoImg: { width: 90, height: 90, borderRadius: 10 },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  addPhotoBtn: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: TANGERINE,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoText: { fontSize: 12, color: TANGERINE, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: CREAM_2,
  },
  chipActive: { backgroundColor: TANGERINE, borderColor: TANGERINE },
  chipText: { fontSize: 13, color: MUTE, fontWeight: '600' },
  chipTextActive: { color: CREAM },
  typeToggleSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 16,
  },
  typeToggleLabel: { fontSize: 14, fontWeight: '700', color: INK, marginBottom: 12 },
  typeToggleRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: CREAM_2,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  typeBtnActive: { backgroundColor: TANGERINE, borderColor: TANGERINE },
  typeBtnActiveBorrow: { backgroundColor: '#7BA7BC', borderColor: '#7BA7BC' },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: MUTE },
  typeBtnTextActive: { color: CREAM },
  typeBtnSub: { fontSize: 11, color: MUTE },
  blockedPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CREAM_2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  blockedPeriodText: { fontSize: 13, color: INK, fontWeight: '600' },
  addPeriodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7BA7BC',
    borderRadius: 999,
    paddingVertical: 10,
    marginTop: 12,
  },
  addPeriodBtnText: { fontSize: 14, fontWeight: '700', color: CREAM },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TANGERINE,
    margin: 16,
    borderRadius: 999,
    paddingVertical: 16,
    shadowColor: TANGERINE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 17, fontWeight: '800', color: CREAM },
});
