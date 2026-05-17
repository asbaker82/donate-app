import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/AuthContext';

const TANGERINE = '#F26B3A';
const TANG_DEEP = '#D8531F';
const CREAM_2   = '#F4ECDD';
const INK       = '#1F1A17';
const MUTE      = '#847A70';
const BORDER    = '#E8DDD0';

export default function VerifyScreen() {
  const router = useRouter();
  const { verifyOTP, isExistingUser, pendingPhone } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    setCode(digits);
    if (error) setError('');
    if (digits.length === 4) handleVerify(digits);
  };

  const handleVerify = async (c = code) => {
    if (c.length !== 4) return;
    setLoading(true);
    const ok = await verifyOTP(c);
    setLoading(false);
    if (!ok) {
      setError('Incorrect code. Please check your messages and try again.');
      setCode('');
      return;
    }
    if (isExistingUser) {
      router.replace('/(tabs)');
    } else {
      router.push('/(auth)/name');
    }
  };

  const displayPhone = pendingPhone
    ? pendingPhone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4')
    : '';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>💬</Text>
          </View>
          <Text style={styles.title}>Check your texts</Text>
          <Text style={styles.subtitle}>
            We sent a 4-digit code to{'\n'}
            <Text style={styles.phone}>{displayPhone}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            ref={inputRef}
            style={[styles.codeInput, error ? styles.codeInputError : null]}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="- - - -"
            placeholderTextColor={BORDER}
            textAlign="center"
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              code.length !== 4 && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={() => handleVerify()}
            disabled={loading || code.length !== 4}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Verify</Text>
            }
          </Pressable>

          <Text style={styles.hint}>
            Didn't receive a code?{' '}
            <Text style={styles.hintLink} onPress={() => router.back()}>Re-enter your number</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24 },
  backBtn: { marginBottom: 24, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: TANGERINE, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: CREAM_2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: '800', color: INK },
  subtitle: { fontSize: 15, color: MUTE, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  phone: { fontWeight: '700', color: INK },
  form: { width: '100%', maxWidth: 320, alignSelf: 'center' },
  codeInput: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 12,
    color: INK,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 16,
    height: 72,
    backgroundColor: CREAM_2,
  },
  codeInputError: { borderColor: TANG_DEEP },
  errorText: { color: TANG_DEEP, fontSize: 13, marginTop: 8, textAlign: 'center' },
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
  hint: { marginTop: 24, fontSize: 13, color: MUTE, textAlign: 'center' },
  hintLink: { fontWeight: '700', color: TANGERINE },
});
