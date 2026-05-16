import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/AuthContext';

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
      setError('Incorrect code. Try 1234.');
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
          <View style={styles.icon}>
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
            placeholderTextColor="#cbd5e0"
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

          <Text style={styles.hint}>Hint: the code is <Text style={styles.hintCode}>1234</Text></Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24 },
  backBtn: { marginBottom: 24, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: '#10B981', fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 40 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: '800', color: '#2d3748' },
  subtitle: { fontSize: 15, color: '#718096', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  phone: { fontWeight: '700', color: '#2d3748' },
  form: { width: '100%', maxWidth: 320, alignSelf: 'center' },
  codeInput: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 12,
    color: '#2d3748',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 72,
    backgroundColor: '#f7fafc',
  },
  codeInputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 13, marginTop: 8, textAlign: 'center' },
  btn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnDisabled: { backgroundColor: '#a0aec0' },
  btnPressed: { opacity: 0.85 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  hint: { marginTop: 24, fontSize: 13, color: '#a0aec0', textAlign: 'center' },
  hintCode: { fontWeight: '700', color: '#10B981' },
});
