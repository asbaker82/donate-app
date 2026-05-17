import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/AuthContext';
import HeaderLogo from '@/components/HeaderLogo';

const TANGERINE = '#F26B3A';
const TANG_DEEP = '#D8531F';
const CREAM     = '#FBF6EE';
const CREAM_2   = '#F4ECDD';
const INK       = '#1F1A17';
const MUTE      = '#847A70';
const BORDER    = '#E8DDD0';

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function PhoneScreen() {
  const router = useRouter();
  const { sendOTP } = useAuth();
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const digits = raw.replace(/\D/g, '');
  const valid = digits.length === 10;

  const handleChange = (text: string) => {
    const d = text.replace(/\D/g, '').slice(0, 10);
    setRaw(d);
    if (error) setError('');
  };

  const handleContinue = async () => {
    if (!valid) {
      setError('Please enter a valid 10-digit US phone number.');
      return;
    }
    setLoading(true);
    try {
      await sendOTP(raw);
      router.push('/(auth)/verify');
    } catch (e: any) {
      const msg = e?.message ?? JSON.stringify(e);
      console.error('sendOTP error:', msg);
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <HeaderLogo size={32} />
          </View>
          <Text style={styles.title}>Welcome to Yoink It</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number to get started. We'll send a verification code.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={[styles.inputRow, error ? styles.inputError : null]}>
            <Text style={styles.countryCode}>+1</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="(555) 000-0000"
              placeholderTextColor={MUTE}
              keyboardType="phone-pad"
              value={formatPhoneDisplay(raw)}
              onChangeText={handleChange}
              maxLength={14}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              autoFocus
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.btn, !valid && styles.btnDisabled, pressed && styles.btnPressed]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Send Verification Code</Text>
            }
          </Pressable>

          <Text style={styles.hint}>
            We'll send a one-time verification code to this number.{'\n'}
            Standard messaging rates may apply.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: CREAM },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoWrap: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: INK, textAlign: 'center' },
  subtitle: { fontSize: 15, color: MUTE, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: INK, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: CREAM_2,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: TANG_DEEP },
  countryCode: { fontSize: 16, color: INK, marginRight: 8, fontWeight: '600' },
  input: { flex: 1, fontSize: 17, color: INK },
  errorText: { color: TANG_DEEP, fontSize: 13, marginTop: 6 },
  btn: {
    backgroundColor: TANGERINE,
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnDisabled: { backgroundColor: MUTE },
  btnPressed: { opacity: 0.85 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  hint: {
    marginTop: 28,
    fontSize: 12,
    color: MUTE,
    textAlign: 'center',
    lineHeight: 18,
    backgroundColor: CREAM_2,
    borderRadius: 8,
    padding: 12,
  },
});
