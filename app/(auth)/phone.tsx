import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/AuthContext';

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
    await sendOTP(raw);
    setLoading(false);
    router.push('/(auth)/verify');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>D</Text>
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
              placeholderTextColor="#a0aec0"
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
            Demo: use any of these numbers to sign in as an existing user:{'\n'}
            (555) 555-0101 · (555) 555-0102 · (555) 555-0103 · (555) 555-0104{'\n'}
            Or enter any new number to register.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: { fontSize: 36, fontWeight: '900', color: '#fff' },
  title: { fontSize: 24, fontWeight: '800', color: '#2d3748', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#718096', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#4a5568', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f7fafc',
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: '#e53e3e' },
  countryCode: { fontSize: 16, color: '#4a5568', marginRight: 8, fontWeight: '600' },
  input: { flex: 1, fontSize: 17, color: '#2d3748' },
  errorText: { color: '#e53e3e', fontSize: 13, marginTop: 6 },
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
  hint: {
    marginTop: 28,
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
    lineHeight: 18,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 12,
  },
});
