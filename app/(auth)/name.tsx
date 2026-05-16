import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/AuthContext';

export default function NameScreen() {
  const router = useRouter();
  const { completeRegistration } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const valid = name.trim().split(/\s+/).filter(Boolean).length >= 2;

  const handleContinue = async () => {
    if (!valid) {
      setError('Please enter your first and last name.');
      return;
    }
    setLoading(true);
    await completeRegistration(name);
    setLoading(false);
    router.push('/(auth)/contacts');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>👋</Text>
          </View>
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>
            This is how your friends will see you on Donate App.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="First Last"
            placeholderTextColor="#a0aec0"
            value={name}
            onChangeText={t => { setName(t); if (error) setError(''); }}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            autoFocus
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              !valid && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Continue</Text>
            }
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
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
  form: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#4a5568', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f7fafc',
    paddingHorizontal: 16,
    height: 52,
    fontSize: 17,
    color: '#2d3748',
  },
  inputError: { borderColor: '#e53e3e' },
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
});
