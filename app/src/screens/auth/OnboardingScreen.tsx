import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ScreenWrapper, GradientButton, colors, typography } from '@astro-shine/shared-ui';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const slides = [
  { icon: 'star', title: 'Discover Your Destiny', sub: 'Get personalized astrology insights based on your birth chart' },
  { icon: 'people', title: 'Connect with Experts', sub: 'Chat with verified astrologers anytime, anywhere' },
  { icon: 'moon', title: 'Daily Guidance', sub: 'Horoscope, panchang, and spiritual content at your fingertips' },
];

export function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = React.useState(0);
  return (
    <ScreenWrapper edges={['top', 'bottom']} noPadding>
      <View style={styles.container}>
        <View style={styles.slide}>
          <Ionicons name={slides[step].icon as any} size={80} color={colors.accentGold} />
          <Text style={[typography.hero, { marginTop: 32, textAlign: 'center' }]}>{slides[step].title}</Text>
          <Text style={[typography.body, { marginTop: 16, textAlign: 'center', lineHeight: 22 }]}>{slides[step].sub}</Text>
        </View>
        <View style={styles.dots}>{slides.map((_, i) => <View key={i} style={[styles.dot, i === step && styles.activeDot]} />)}</View>
        <View style={{ paddingHorizontal: 24, gap: 12, marginBottom: 40 }}>
          {step < 2 ? <GradientButton title="Next" onPress={() => setStep(step + 1)} /> : <GradientButton title="Get Started" onPress={() => navigation.replace('Login')} />}
          <Text style={styles.skip} onPress={() => navigation.replace('Login')}>Skip</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingTop: 60 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', width: width * 0.85 },
  dots: { flexDirection: 'row', gap: 8, marginVertical: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  activeDot: { width: 24, backgroundColor: colors.primaryLight },
  skip: { textAlign: 'center', color: colors.textSecondary, fontSize: 14 },
});
