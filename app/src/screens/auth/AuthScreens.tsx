import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Image } from 'react-native';
import { ScreenWrapper, GradientButton, colors, radii, typography } from '../../shared';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../shared/api-client';

export function LoginScreen({ navigation }: any) {
  const { loginAsUser, theme, setTheme } = useAuth();
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

  const isDark = theme === 'dark';
  const logoOpacity = isDark ? 0.18 : 0.14;

  return (
    <ScreenWrapper edges={['top', 'bottom']} noPadding backgroundColor="#09090B">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={[styles.themeToggle, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Image source={require('../../../assets/logo.jpg')} style={[styles.backgroundImage, { opacity: logoOpacity }]} resizeMode="cover" />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image source={require('../../../assets/logo.jpg')} style={styles.headerLogo} resizeMode="contain" />
            <Text style={[typography.hero, styles.headerTitle]}>Welcome Back</Text>
            <Text style={[typography.body, styles.headerSub]}>Sign in to continue your cosmic journey</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.cardBorder }]}>
            <Input icon="mail-outline" placeholder="Email" value={email} onChange={setEmail} keyboardType="email-address" />
            <Input icon="lock-closed-outline" placeholder="Password" value={password} onChange={setPassword} secure={!showPw} right={<Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} onPress={() => setShowPw(!showPw)} />} />
            <GradientButton title={loading ? 'Signing in...' : 'Sign In'} onPress={handleLogin} disabled={loading} />
          </View>

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkTextStatic}>Don't have an account? <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Register</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('OtpLogin')}>
            <Text style={styles.linkTextStatic}>Login with OTP</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

export function RegisterScreen({ navigation }: any) {
  const { registerUser, theme, setTheme } = useAuth();
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

  const isDark = theme === 'dark';
  const logoOpacity = isDark ? 0.18 : 0.14;

  return (
    <ScreenWrapper edges={['top', 'bottom']} noPadding backgroundColor="#09090B">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={[styles.themeToggle, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Image source={require('../../../assets/logo.jpg')} style={[styles.backgroundImage, { opacity: logoOpacity }]} resizeMode="cover" />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image source={require('../../../assets/logo.jpg')} style={styles.headerLogo} resizeMode="contain" />
            <Text style={[typography.hero, styles.headerTitle]}>Join Us</Text>
            <Text style={[typography.body, styles.headerSub]}>Begin your spiritual journey</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.cardBorder }]}>
            <Input icon="person-outline" placeholder="Full Name" value={name} onChange={setName} />
            <Input icon="mail-outline" placeholder="Email" value={email} onChange={setEmail} keyboardType="email-address" />
            <Input icon="call-outline" placeholder="Phone (optional)" value={phone} onChange={setPhone} keyboardType="phone-pad" />
            <Input icon="lock-closed-outline" placeholder="Password" value={password} onChange={setPassword} secure />
            <GradientButton title={loading ? 'Creating...' : 'Create Account'} onPress={handleRegister} disabled={loading} />
          </View>

          <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
            <Text style={styles.linkTextStatic}>Already have an account? <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

export function OtpLoginScreen({ navigation }: any) {
  const { loginWithOtp, theme, setTheme } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => { if (!phone) return; try { await api.auth.sendOtp(phone); setSent(true); } catch { setError('Failed'); } };
  const verify = async () => { setLoading(true); try { await loginWithOtp(phone, otp, 'user'); } catch { setError('Invalid OTP'); } finally { setLoading(false); } };

  const isDark = theme === 'dark';
  const logoOpacity = isDark ? 0.18 : 0.14;

  return (
    <ScreenWrapper edges={['top', 'bottom']} noPadding backgroundColor="#09090B">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={[styles.themeToggle, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Image source={require('../../../assets/logo.jpg')} style={[styles.backgroundImage, { opacity: logoOpacity }]} resizeMode="cover" />
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image source={require('../../../assets/logo.jpg')} style={styles.headerLogo} resizeMode="contain" />
            <Text style={[typography.hero, styles.headerTitle]}>OTP Login</Text>
            <Text style={[typography.body, styles.headerSub]}>{sent ? `Enter code sent to ${phone}` : 'Enter phone number'}</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.cardBorder }]}>
            <Input icon="call-outline" placeholder="Phone" value={phone} onChange={setPhone} keyboardType="phone-pad" editable={!sent} />
            {!sent ? (
              <GradientButton title="Send OTP" onPress={sendOtp} />
            ) : (
              <>
                <Input icon="key-outline" placeholder="OTP Code" value={otp} onChange={setOtp} keyboardType="number-pad" />
                <GradientButton title={loading ? 'Verifying...' : 'Verify & Login'} onPress={verify} disabled={loading} />
                <Text style={styles.resend} onPress={sendOtp}>Resend OTP</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkTextStatic}>Back to <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Login</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function Input({ icon, placeholder, value, onChange, secure, keyboardType, right, editable = true }: any) {
  const { theme } = useAuth();
  return (
    <View style={[styles.inputContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]}>
      <Ionicons name={icon} size={20} color={colors.textMuted} style={{ marginRight: 10 }} />
      <TextInput 
        style={[styles.input, { color: colors.textPrimary }]} 
        placeholder={placeholder} 
        placeholderTextColor={colors.textMuted} 
        value={value} 
        onChangeText={onChange} 
        secureTextEntry={secure} 
        keyboardType={keyboardType} 
        autoCapitalize="none" 
        editable={editable} 
      />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  headerLogo: { width: 100, height: 100, marginBottom: 8, borderRadius: 12 },
  headerTitle: { color: '#FFFFFF' },
  headerSub: { color: '#B6B6C2' },
  error: { color: colors.danger, textAlign: 'center', marginBottom: 16, fontSize: 14 },
  formCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.input, borderWidth: 1, paddingHorizontal: 14, height: 52, marginBottom: 14 },
  input: { flex: 1, fontSize: 15 },
  link: { alignItems: 'center', marginTop: 16 },
  linkTextStatic: { fontSize: 14, color: '#B6B6C2' },
  resend: { textAlign: 'center', marginTop: 12, color: colors.primaryLight, fontWeight: '600' },
  themeToggle: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 16,
    right: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
