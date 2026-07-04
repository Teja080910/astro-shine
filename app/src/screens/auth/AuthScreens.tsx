import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { ScreenWrapper, GradientButton, colors, radii, typography } from '../../shared';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export function LoginScreen({ navigation }: any) {
  const { loginAsUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    try { await loginAsUser(email, password); } catch (e: any) { setError(e?.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <ScreenWrapper scroll edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Ionicons name="star" size={48} color={colors.accentGold} />
            <Text style={typography.hero}>Welcome Back</Text>
            <Text style={typography.body}>Sign in to continue your cosmic journey</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Input icon="mail-outline" placeholder="Email" value={email} onChange={setEmail} keyboardType="email-address" />
          <Input icon="lock-closed-outline" placeholder="Password" value={password} onChange={setPassword} secure={!showPw} right={<Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} onPress={() => setShowPw(!showPw)} />} />
          <GradientButton title={loading ? 'Signing in...' : 'Sign In'} onPress={handleLogin} disabled={loading} />
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Don't have an account? <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Register</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('OtpLogin')}>
            <Text style={styles.linkText}>Login with OTP</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

export function RegisterScreen({ navigation }: any) {
  const { registerUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Required fields missing'); return; }
    setLoading(true); setError('');
    try { await registerUser(name, email, password, phone || undefined); } catch (e: any) { setError(e?.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <ScreenWrapper scroll>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><Ionicons name="sparkles" size={48} color={colors.accentGold} /><Text style={typography.hero}>Join Us</Text><Text style={typography.body}>Begin your spiritual journey</Text></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Input icon="person-outline" placeholder="Full Name" value={name} onChange={setName} />
        <Input icon="mail-outline" placeholder="Email" value={email} onChange={setEmail} keyboardType="email-address" />
        <Input icon="call-outline" placeholder="Phone (optional)" value={phone} onChange={setPhone} keyboardType="phone-pad" />
        <Input icon="lock-closed-outline" placeholder="Password" value={password} onChange={setPassword} secure />
        <GradientButton title={loading ? 'Creating...' : 'Create Account'} onPress={handleRegister} disabled={loading} />
        <Text style={styles.link} onPress={() => navigation.goBack()}>Already have an account? <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Sign In</Text></Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

export function OtpLoginScreen({ navigation }: any) {
  const { loginWithOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => { if (!phone) return; try { await api.auth.sendOtp(phone); setSent(true); } catch { setError('Failed'); } };
  const verify = async () => { setLoading(true); try { await loginWithOtp(phone, otp, 'user'); } catch { setError('Invalid OTP'); } finally { setLoading(false); } };

  return (
    <ScreenWrapper scroll>
      <View style={styles.container}>
        <View style={styles.header}><Ionicons name="phone-portrait-outline" size={48} color={colors.accentGold} /><Text style={typography.hero}>OTP Login</Text><Text style={typography.body}>{sent ? `Enter code sent to ${phone}` : 'Enter phone number'}</Text></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Input icon="call-outline" placeholder="Phone" value={phone} onChange={setPhone} keyboardType="phone-pad" editable={!sent} />
        {!sent ? <GradientButton title="Send OTP" onPress={sendOtp} /> : (
          <>
            <Input icon="key-outline" placeholder="OTP Code" value={otp} onChange={setOtp} keyboardType="number-pad" />
            <GradientButton title={loading ? 'Verifying...' : 'Verify & Login'} onPress={verify} disabled={loading} />
            <Text style={styles.resend} onPress={sendOtp}>Resend OTP</Text>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

function Input({ icon, placeholder, value, onChange, secure, keyboardType, right, editable = true }: any) {
  return (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color={colors.textMuted} style={{ marginRight: 10 }} />
      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={colors.textMuted} value={value} onChangeText={onChange} secureTextEntry={secure} keyboardType={keyboardType} autoCapitalize="none" editable={editable} />
      {right}
    </View>
  );
}

import { api } from '../../shared/api-client';

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 30 },
  error: { color: colors.danger, textAlign: 'center', marginBottom: 16, fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLight, borderRadius: radii.input, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 14, height: 52, marginBottom: 14 },
  input: { flex: 1, fontSize: 15, color: colors.textPrimary },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 14, color: colors.textSecondary },
  resend: { textAlign: 'center', marginTop: 12, color: colors.primaryLight, fontWeight: '600' },
});
