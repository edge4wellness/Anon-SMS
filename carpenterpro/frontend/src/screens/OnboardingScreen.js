import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';

export default function OnboardingScreen({ onComplete }) {
  const [zipCode, setZipCode] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!/^\d{5}$/.test(zipCode)) {
      Alert.alert('Invalid Zip Code', 'Please enter a valid 5-digit zip code.');
      return false;
    }
    if (!businessName.trim()) {
      Alert.alert('Business Name Required', 'Please enter your business name.');
      return false;
    }
    return true;
  }

  async function handleContinue() {
    if (!validate()) return;
    setLoading(true);
    try {
      await onComplete({ zipCode, businessName: businessName.trim() });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <Text style={styles.logoText}>CarpenterPro</Text>
          <Text style={styles.tagline}>Fast estimates. Built for the job site.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Smith Custom Carpentry"
            placeholderTextColor="#AAA"
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>Service Zip Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 90210"
            placeholderTextColor="#AAA"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="numeric"
            maxLength={5}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Setting up…' : 'Get Started'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  hero: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#1A73E8', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#888', marginTop: 6 },
  form: {},
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  btn: {
    marginTop: 28,
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
