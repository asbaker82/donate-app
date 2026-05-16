import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface NominatimResult {
  place_id: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: object;
  error?: boolean;
}

function formatAddress(result: NominatimResult): string {
  const a = result.address;
  const street =
    a.house_number && a.road
      ? `${a.house_number} ${a.road}`
      : a.road ?? '';
  const city = a.city ?? a.town ?? a.village ?? a.county ?? '';
  const state = a.state ?? '';
  const zip = a.postcode ?? '';
  const parts = [street, city, [state, zip].filter(Boolean).join(' ')].filter(Boolean);
  return parts.join(', ') || result.display_name;
}

export default function AddressInput({ value, onChangeText, placeholder, style, error }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextFetch = useRef(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (suppressNextFetch.current) {
      suppressNextFetch.current = false;
      return;
    }

    if (value.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(value)}` +
          `&format=json&addressdetails=1&limit=6&countrycodes=us`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'DonateApp/1.0 (contact@example.com)' },
        });
        const data: NominatimResult[] = await res.json();
        // De-dupe by formatted address
        const seen = new Set<string>();
        const unique = data.filter(r => {
          const formatted = formatAddress(r);
          if (seen.has(formatted)) return false;
          seen.add(formatted);
          return true;
        });
        setSuggestions(unique);
        setOpen(unique.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSelect = (result: NominatimResult) => {
    suppressNextFetch.current = true;
    onChangeText(formatAddress(result));
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.inputRow, open && styles.inputRowOpen, error && styles.inputRowError]}>
        <FontAwesome name="map-marker" size={15} color="#2E8B57" style={styles.pin} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? 'Start typing an address…'}
          placeholderTextColor="#a0aec0"
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          autoCorrect={false}
          autoComplete="street-address"
        />
        {loading ? (
          <ActivityIndicator size="small" color="#2E8B57" />
        ) : value.length > 0 ? (
          <Pressable onPress={() => { onChangeText(''); setSuggestions([]); setOpen(false); }}>
            <FontAwesome name="times-circle" size={16} color="#a0aec0" />
          </Pressable>
        ) : null}
      </View>

      {open && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((result, i) => {
            const formatted = formatAddress(result);
            const [firstLine, ...rest] = formatted.split(', ');
            return (
              <Pressable
                key={result.place_id}
                style={[styles.row, i < suggestions.length - 1 && styles.rowBorder]}
                onPress={() => handleSelect(result)}
              >
                <FontAwesome name="map-marker" size={13} color="#2E8B57" style={styles.rowPin} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowMain} numberOfLines={1}>{firstLine}</Text>
                  {rest.length > 0 && (
                    <Text style={styles.rowSub} numberOfLines={1}>{rest.join(', ')}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    gap: 8,
  },
  inputRowError: { borderColor: '#fc8181', backgroundColor: '#fff5f5' },
  inputRowOpen: {
    borderColor: '#2E8B57',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  pin: { width: 16 },
  input: { flex: 1, fontSize: 15, color: '#2d3748' },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#2E8B57',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowPin: { marginTop: 1 },
  rowMain: { fontSize: 14, color: '#2d3748', fontWeight: '600' },
  rowSub: { fontSize: 12, color: '#718096', marginTop: 1 },
});
