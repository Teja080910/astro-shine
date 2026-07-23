import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Image, Modal, Keyboard } from 'react-native';
import { ScreenWrapper, GradientButton } from '../../shared';
import { colors, radii, typography, shadows } from '../../shared/theme';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../shared/api-client';
import { OTPWidget } from '../../shared/msg91-otp-widget';
import { LinearGradient } from 'expo-linear-gradient';

function useKeyboard() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardVisible;
}

export function LoginScreen({ navigation }: any) {
  const { loginAsUser, theme, setTheme } = useAuth();
  const keyboardVisible = useKeyboard();
  const scrollViewRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    try { await loginAsUser(email, password); } catch (e: any) { setError(e?.response?.data?.message || 'Login failed'); setLoading(false); }
  };

  const isDark = theme === 'dark';
  const logoOpacity = isDark ? 0.18 : 0.14;

  return (
    <ScreenWrapper edges={['top', 'bottom']} noPadding>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <TouchableOpacity style={[styles.themeToggle, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={[styles.container, keyboardVisible && { paddingBottom: 90 }]} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            {!keyboardVisible && (
              <Image source={require('../../../assets/logo_clean.png')} style={styles.headerLogo} resizeMode="contain" />
            )}
            <Text style={[typography.hero, { color: colors.textPrimary }]}>Welcome Back</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>Sign in to continue your cosmic journey</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.inputBorder }, shadows.card]}>
            <Input icon="mail-outline" placeholder="Email" value={email} onChange={setEmail} keyboardType="email-address" />
            <Input icon="lock-closed-outline" placeholder="Password" value={password} onChange={setPassword} secure={!showPw} right={<Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} onPress={() => setShowPw(!showPw)} />} onFocus={() => { if (!keyboardVisible) { setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); } }} />
            <GradientButton title={loading ? 'Signing in...' : 'Sign In'} onPress={handleLogin} disabled={loading} />
            
            <View style={styles.orDivider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
              <Text style={[styles.orText, { color: colors.textMuted }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
            </View>

            <TouchableOpacity 
              style={[styles.otpLoginButton, { borderColor: colors.primary }]} 
              onPress={() => navigation.navigate('OtpLogin')}
            >
              <Ionicons name="key-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.otpLoginButtonText, { color: colors.primary }]}>Login with OTP</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.linkTextStatic, { color: colors.textSecondary }]}>Don't have an account? <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Register</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.linkTextStatic, { color: colors.textMuted, fontSize: 13 }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

export function RegisterScreen({ navigation }: any) {
  const { registerUser, registerAstrologer, theme, setTheme } = useAuth();
  const keyboardVisible = useKeyboard();
  const scrollViewRef = useRef<ScrollView>(null);
  const [step, setStep] = useState<0 | 1>(0);
  const [selectedRole, setSelectedRole] = useState<'user' | 'astrologer'>('user');
  const [verMode, setVerMode] = useState<'email' | 'phone'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const sendRegistrationOtp = async () => {
    if (!name || !email || !phone || !password) {
      setError('Please fill in all mandatory fields');
      return;
    }
    setError(''); setSendingOtp(true);
    try {
      if (verMode === 'email') {
        await api.auth.sendRegistrationOtp(email, 'email');
      } else {
        await api.auth.sendRegistrationOtp(phone, 'phone');
      }
      setOtpSent(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) { setError('Please enter OTP'); return; }
    setError(''); setVerifyingOtp(true);
    try {
      const identifier = verMode === 'email' ? email : phone;
      await api.auth.verifyRegistrationOtp(identifier, verMode, otp);
      setOtpVerified(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true); setError('');
    try {
      if (selectedRole === 'astrologer') {
        await registerAstrologer(name, email, password, phone);
      } else {
        await registerUser(name, email, password, phone);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const logoOpacity = isDark ? 0.18 : 0.14;

  return (
    <ScreenWrapper edges={['top', 'bottom']} noPadding>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <TouchableOpacity style={[styles.themeToggle, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={[styles.container, keyboardVisible && { paddingBottom: 90 }]} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          {step === 0 ? (
            // STEP 0: Role Selection Cards
            <>
              <View style={styles.header}>
                {!keyboardVisible && (
                  <Image source={require('../../../assets/logo_clean.png')} style={styles.headerLogo} resizeMode="contain" />
                )}
                <Text style={[typography.hero, { color: colors.textPrimary }]}>Join Us</Text>
                <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>Select how you want to join our cosmic community</Text>
              </View>

              <View style={styles.selectionContainer}>
                <TouchableOpacity 
                  style={[styles.roleCard, { backgroundColor: colors.glassBg, borderColor: colors.inputBorder }, shadows.card]}
                  onPress={() => { setSelectedRole('user'); setStep(1); setError(''); }}
                >
                  <View style={[styles.roleCardIconContainer, { backgroundColor: colors.surfaceLight }]}>
                    <Ionicons name="person-outline" size={32} color={colors.primaryLight} />
                  </View>
                  <Text style={[typography.cardTitle, styles.roleCardTitle, { color: colors.textPrimary }]}>Join as a User</Text>
                  <Text style={[typography.body, styles.roleCardDesc, { color: colors.textMuted }]}>Get personalized astrology insights and chat with verified experts</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.roleCard, { backgroundColor: colors.glassBg, borderColor: colors.inputBorder }, shadows.card]}
                  onPress={() => { setSelectedRole('astrologer'); setStep(1); setError(''); }}
                >
                  <View style={[styles.roleCardIconContainer, { backgroundColor: colors.surfaceLight }]}>
                    <Ionicons name="star-outline" size={32} color={colors.accentGold} />
                  </View>
                  <Text style={[typography.cardTitle, styles.roleCardTitle, { color: colors.textPrimary }]}>Join as an Astrologer</Text>
                  <Text style={[typography.body, styles.roleCardDesc, { color: colors.textMuted }]}>Share your wisdom, consult clients, and manage your consultations</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // STEP 1: Registration Form
            <>
              <View style={styles.header}>
                {!keyboardVisible && (
                  <Image source={require('../../../assets/logo_clean.png')} style={styles.headerLogo} resizeMode="contain" />
                )}
                <Text style={[typography.hero, { color: colors.textPrimary }]}>{selectedRole === 'user' ? 'User Signup' : 'Astrologer Signup'}</Text>
                <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>{selectedRole === 'user' ? 'Begin your spiritual journey' : 'Register your advisor account'}</Text>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity style={styles.backToRoleButton} onPress={() => setStep(0)}>
                <Ionicons name="arrow-back-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.backToRoleText, { color: colors.textSecondary }]}>Change Role Selection</Text>
              </TouchableOpacity>

              <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.inputBorder }, shadows.card]}>
                <Input icon="person-outline" placeholder="Full Name" value={name} onChange={setName} />
                <Input icon="mail-outline" placeholder="Email Address" value={email} onChange={setEmail} keyboardType="email-address" />
                <Input icon="call-outline" placeholder="Phone Number" value={phone} onChange={setPhone} keyboardType="phone-pad" onFocus={() => { if (!keyboardVisible) { setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); } }} />
                <Input icon="lock-closed-outline" placeholder="Password" value={password} onChange={setPassword} secure={!showPw} right={<Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} onPress={() => setShowPw(!showPw)} />} onFocus={() => { if (!keyboardVisible) { setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); } }} />

                <Text style={[styles.verLabel, { color: colors.textPrimary }]}>Verify Account Via:</Text>
                <View style={[styles.roleContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder, marginBottom: 16 }]}>
                  <TouchableOpacity 
                    style={[styles.roleButton, verMode === 'email' && styles.roleButtonActive]} 
                    onPress={() => { if (!otpSent) { setVerMode('email'); setError(''); } }}
                    disabled={otpSent}
                  >
                    <Ionicons name="mail-outline" size={16} color={verMode === 'email' ? '#FFFFFF' : colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.roleText, { color: verMode === 'email' ? '#FFFFFF' : colors.textMuted }]}>Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleButton, verMode === 'phone' && styles.roleButtonActive]} 
                    onPress={() => { if (!otpSent) { setVerMode('phone'); setError(''); } }}
                    disabled={otpSent}
                  >
                    <Ionicons name="call-outline" size={16} color={verMode === 'phone' ? '#FFFFFF' : colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.roleText, { color: verMode === 'phone' ? '#FFFFFF' : colors.textMuted }]}>Phone OTP</Text>
                  </TouchableOpacity>
                </View>

                {!otpSent ? (
                  <GradientButton title={sendingOtp ? 'Sending OTP...' : 'Send OTP'} onPress={sendRegistrationOtp} disabled={sendingOtp} />
                ) : !otpVerified ? (
                  <>
                    <Input icon="key-outline" placeholder="Enter OTP" value={otp} onChange={setOtp} keyboardType="number-pad" onFocus={() => { if (!keyboardVisible) { setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); } }} />
                    <GradientButton title={verifyingOtp ? 'Verifying...' : 'Verify OTP'} onPress={verifyOtp} disabled={verifyingOtp} />
                    <Text style={[styles.resend, sendingOtp && { opacity: 0.5 }]} onPress={sendingOtp ? undefined : sendRegistrationOtp}>
                      {sendingOtp ? 'Resending OTP...' : 'Resend OTP'}
                    </Text>
                  </>
                ) : (
                  <GradientButton title={loading ? 'Creating...' : 'Create Account'} onPress={handleRegister} disabled={loading} />
                )}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
            <Text style={[styles.linkTextStatic, { color: colors.textSecondary }]}>Already have an account? <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

export function OtpLoginScreen({ navigation }: any) {
  const { loginWithOtp, theme, setTheme } = useAuth();
  const keyboardVisible = useKeyboard();
  const scrollViewRef = useRef<ScrollView>(null);
  const [verType, setVerType] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [reqId, setReqId] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  useEffect(() => {
    OTPWidget.initializeWidget(
      process.env.EXPO_PUBLIC_MSG91_WIDGET_ID || '',
      process.env.EXPO_PUBLIC_MSG91_TOKEN_AUTH || '',
    );
  }, []);

  const sendOtp = async () => {
    if (!identifier) return;
    setError('');
    setSending(true);
    try {
      if (verType === 'email') {
        try {
          await api.auth.sendEmailOtp(identifier);
        } catch (e: any) {
          if (e?.response?.data?.message === 'USER_NOT_FOUND') {
            setShowRegisterPrompt(true);
            return;
          }
          throw e;
        }
      } else {
        const { exists } = await api.auth.checkPhone(identifier.replace(/\D/g, ''));
        if (!exists) {
          setShowRegisterPrompt(true);
          return;
        }
        const res = await OTPWidget.sendOTP({ identifier: `91${identifier.replace(/\D/g, '')}` });
        if (!res?.message) throw new Error('Failed to send OTP');
        setReqId(res.message);
      }
      setSent(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (e: any) {
      const detail = e?.response?.data?.message || e?.message || e?.toString() || 'Failed to send OTP';
      setError(detail);
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    if (!identifier || !otp) return;
    setLoading(true);
    setError('');
    try {
      if (verType === 'email') {
        try {
          await loginWithOtp(identifier, otp, 'user', 'email');
        } catch (e: any) {
          if (e?.response?.data?.message === 'USER_NOT_FOUND') {
            setShowRegisterPrompt(true);
          } else {
            throw e;
          }
        }
      } else {
        const res = await OTPWidget.verifyOTP({ reqId, otp });
        if (res.type === 'success') {
          try {
            await loginWithOtp(identifier, otp, 'user', 'phone');
          } catch (e: any) {
            if (e?.response?.data?.message === 'USER_NOT_FOUND') {
              setShowRegisterPrompt(true);
            } else {
              throw e;
            }
          }
        } else {
          throw new Error(res.message || 'Invalid OTP');
        }
      }
    } catch (e: any) {
      const detail = e?.response?.data?.message || e?.message || e?.toString() || 'Invalid OTP';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const logoOpacity = isDark ? 0.18 : 0.14;

  return (
    <ScreenWrapper edges={['top', 'bottom']} noPadding>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <TouchableOpacity style={[styles.themeToggle, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={[styles.container, keyboardVisible && { paddingBottom: 90 }]} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            {!keyboardVisible && (
              <Image source={require('../../../assets/logo_clean.png')} style={styles.headerLogo} resizeMode="contain" />
            )}
            <Text style={[typography.hero, { color: colors.textPrimary }]}>OTP Login</Text>
            {sent ? (
              <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }]}>
                Enter code sent to{'\n'}
                <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>{identifier}</Text>
              </Text>
            ) : (
              <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                Enter your {verType === 'email' ? 'email address' : 'phone number'}
              </Text>
            )}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.inputBorder, position: 'relative' }, shadows.card]}>
            {/* Verification Type Switcher */}
            <View style={[styles.roleContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]}>
              <TouchableOpacity 
                style={styles.roleButton} 
                onPress={() => { setVerType('phone'); setSent(false); setIdentifier(''); setOtp(''); setError(''); }}
                disabled={sent}
              >
                {verType === 'phone' ? (
                  <View style={[{ flex: 1, width: '100%', height: '100%' }, shadows.button]}>
                    <LinearGradient
                      colors={[colors.gradientStart, colors.gradientMid]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.roleButtonActiveGradient}
                    >
                      <Ionicons name="call-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={[styles.roleText, { color: '#FFFFFF' }]}>Phone</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={styles.roleButtonInactive}>
                    <Ionicons name="call-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.roleText, { color: colors.textMuted }]}>Phone</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.roleButton} 
                onPress={() => { setVerType('email'); setSent(false); setIdentifier(''); setOtp(''); setError(''); }}
                disabled={sent}
              >
                {verType === 'email' ? (
                  <View style={[{ flex: 1, width: '100%', height: '100%' }, shadows.button]}>
                    <LinearGradient
                      colors={[colors.gradientStart, colors.gradientMid]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.roleButtonActiveGradient}
                    >
                      <Ionicons name="mail-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={[styles.roleText, { color: '#FFFFFF' }]}>Email</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={styles.roleButtonInactive}>
                    <Ionicons name="mail-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.roleText, { color: colors.textMuted }]}>Email</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Input 
              icon={verType === 'email' ? 'mail-outline' : 'call-outline'} 
              placeholder={verType === 'email' ? 'Email Address' : 'Phone Number'} 
              value={identifier} 
              onChange={setIdentifier} 
              keyboardType={verType === 'email' ? 'email-address' : 'phone-pad'} 
              editable={!sent} 
              onFocus={() => { if (!keyboardVisible) { setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); } }}
            />
            {!sent ? (
              <GradientButton title={sending ? 'Sending...' : 'Send OTP'} onPress={sendOtp} disabled={sending} />
            ) : (
              <>
                <Input icon="key-outline" placeholder="OTP Code" value={otp} onChange={setOtp} keyboardType="number-pad" onFocus={() => { if (!keyboardVisible) { setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); } }} />
                <GradientButton title={loading ? 'Verifying...' : 'Verify & Login'} onPress={verify} disabled={loading} />
                <Text 
                  style={[styles.resend, sending && { opacity: 0.5 }]} 
                  onPress={sending ? undefined : sendOtp}
                >
                  {sending ? 'Resending OTP...' : 'Resend OTP'}
                </Text>
              </>
            )}

            {/* Floating reload button overlapping the bottom right corner */}
            <TouchableOpacity 
              style={[styles.refreshButton, shadows.floating]} 
              onPress={() => { setSent(false); setIdentifier(''); setOtp(''); setError(''); }}
            >
              <Ionicons name="refresh-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.linkTextStatic, { color: colors.textSecondary }]}>Back to <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Login</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showRegisterPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Ionicons name="person-outline" size={48} color={colors.primaryLight} />
            <Text style={[typography.sectionTitle, { marginTop: 16, textAlign: 'center' }]}>User Not Found</Text>
            <Text style={[typography.body, { marginTop: 8, textAlign: 'center' }]}>No account found with this {verType === 'email' ? 'email' : 'number'}. Please register first.</Text>
            <GradientButton title="Go to Register" onPress={() => { setShowRegisterPrompt(false); navigation.navigate('Register'); }} />
            <TouchableOpacity onPress={() => setShowRegisterPrompt(false)}>
              <Text style={[typography.body, { marginTop: 12, color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

export function ForgotPasswordScreen({ navigation }: any) {
  const { theme, setTheme } = useAuth();
  const keyboardVisible = useKeyboard();
  const scrollViewRef = useRef<ScrollView>(null);
  const [verType, setVerType] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'id' | 'otp' | 'reset'>('id');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!identifier) { setError('Please enter your ' + (verType === 'email' ? 'email' : 'phone number')); return; }
    setLoading(true); setError('');
    try {
      await api.auth.sendForgotPasswordOtp(identifier, verType);
      setStep('otp');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyAndReset = async () => {
    if (!otp || !newPassword) { setError('Please enter OTP and new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      await api.auth.resetPassword(identifier, verType, otp, newPassword);
      setStep('reset');
      setSuccess('Password reset successfully!');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const placeholders = verType === 'email' ? { icon: 'mail-outline', label: 'Email Address', keyboard: 'email-address' } : { icon: 'call-outline', label: 'Phone Number', keyboard: 'phone-pad' };

  return (
    <ScreenWrapper edges={['top', 'bottom']} noPadding>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={[styles.themeToggle, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]} onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <ScrollView ref={scrollViewRef} style={{ flex: 1 }} contentContainerStyle={[styles.container, keyboardVisible && { paddingBottom: 90 }]} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            {!keyboardVisible && (
              <Image source={require('../../../assets/logo_clean.png')} style={styles.headerLogo} resizeMode="contain" />
            )}
            <Text style={[typography.hero, { color: colors.textPrimary }]}>Reset Password</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
              {step === 'id' ? 'Choose how to receive your reset OTP' :
               step === 'otp' ? 'Enter the OTP and your new password' :
               'Your password has been updated'}
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={[styles.error, { color: colors.success }]}>{success}</Text> : null}

          <View style={[styles.formCard, { backgroundColor: colors.glassBg, borderColor: colors.inputBorder }, shadows.card]}>
            {step === 'id' && (
              <>
                <View style={[styles.roleContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }]}>
                  <TouchableOpacity style={[styles.roleButton, verType === 'email' && styles.roleButtonActive]}
                    onPress={() => { setVerType('email'); setError(''); }}>
                    <Ionicons name="mail-outline" size={16} color={verType === 'email' ? '#FFFFFF' : colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.roleText, { color: verType === 'email' ? '#FFFFFF' : colors.textMuted }]}>Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.roleButton, verType === 'phone' && styles.roleButtonActive]}
                    onPress={() => { setVerType('phone'); setError(''); }}>
                    <Ionicons name="call-outline" size={16} color={verType === 'phone' ? '#FFFFFF' : colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.roleText, { color: verType === 'phone' ? '#FFFFFF' : colors.textMuted }]}>Phone</Text>
                  </TouchableOpacity>
                </View>
                <Input icon={placeholders.icon as any} placeholder={placeholders.label} value={identifier} onChange={setIdentifier} keyboardType={placeholders.keyboard as any} onFocus={() => { if (!keyboardVisible) { setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); } }} />
                <GradientButton title={loading ? 'Sending...' : 'Send OTP'} onPress={sendOtp} disabled={loading} />
              </>
            )}

            {step === 'otp' && (
              <>
                <Input icon={placeholders.icon as any} placeholder={placeholders.label} value={identifier} onChange={setIdentifier} editable={false} />
                <Input icon="key-outline" placeholder="OTP Code" value={otp} onChange={setOtp} keyboardType="number-pad" onFocus={() => { if (!keyboardVisible) { setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); } }} />
                <Input icon="lock-closed-outline" placeholder="New Password" value={newPassword} onChange={setNewPassword} secure={!showPw}
                  right={<Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} onPress={() => setShowPw(!showPw)} />} onFocus={() => { if (!keyboardVisible) { setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100); } }} />
                <GradientButton title={loading ? 'Resetting...' : 'Reset Password'} onPress={verifyAndReset} disabled={loading} />
              </>
            )}

            {step === 'reset' && (
              <GradientButton title="Back to Login" onPress={() => navigation.navigate('Login')} />
            )}
          </View>

          <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
            <Text style={[styles.linkTextStatic, { color: colors.textSecondary }]}>Back to <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>Login</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function Input({ icon, placeholder, value, onChange, secure, keyboardType, right, editable = true, onFocus }: any) {
  return (
    <View style={[styles.inputContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.inputBorder }]}>
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
        onFocus={onFocus}
      />
      {right && <View style={{ marginLeft: 4 }}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
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
  headerLogo: { width: 280, height: 203, marginBottom: 8 },
  headerTitle: { color: '#FFFFFF' },
  headerSub: { color: '#B6B6C2' },
  error: { color: colors.danger, textAlign: 'center', marginBottom: 16, fontSize: 14 },
  formCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  roleButtonActiveGradient: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.input - 4,
  },
  roleButtonInactive: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.input - 4,
  },
  refreshButton: {
    position: 'absolute',
    bottom: -22,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.input, borderWidth: 1, paddingHorizontal: 14, height: 52, marginBottom: 14 },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  otpLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    borderRadius: radii.button,
    borderWidth: 1.5,
  },
  otpLoginButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
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
  roleContainer: {
    flexDirection: 'row',
    borderRadius: radii.input,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.input - 4,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionContainer: {
    width: '100%',
    gap: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  roleCard: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  roleCardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  roleCardDesc: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  backToRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  backToRoleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B6B6C2',
  },
  verLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
});
