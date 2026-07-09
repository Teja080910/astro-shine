import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { FloatingBottomBar, colors } from '../shared';

import { AstrologerConsultationScreen, AstrologerHomeScreen, AstrologerNotificationsScreen, AstrologerProfileScreen, AstrologerReviewsScreen, AstrologerWalletScreen, AstrologerWithdrawalScreen } from '../screens/astrologer/AstrologerScreens';
import { LoginScreen, OtpLoginScreen, RegisterScreen } from '../screens/auth/AuthScreens';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import {
  AboutAppScreen,
  AstrologerCommissionScreen,
  AstrologerDocumentsScreen,
  AstrologerGoLiveScreen,
  AstrologerRequestsScreen, AstrologerScheduleScreen,
  BlogsScreen,
  DonationScreen,
  EditProfileScreen,
  MandirPoojaScreen,
  NotificationsScreen,
  OrderHistoryScreen,
  PanchangScreen,
  PrivacyPolicyScreen,
  ReportScreen,
  SupportScreen,
  TermsConditionsScreen,
  VideosScreen,
} from '../screens/shared/SharedScreens';
import { ChatListScreen } from '../screens/user/ChatListScreen';
import { ChatRoomScreen } from '../screens/user/ChatRoomScreen';
import { AstrologerDetailScreen, AstrologerListScreen, KundliScreen, MatchmakingScreen, ProfileScreen, ShopScreen, UserHomeScreen, WalletScreen } from '../screens/user/UserScreens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ThemeToggle() {
  const { theme, setTheme } = useAuth();
  return (
    <TouchableOpacity onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ paddingHorizontal: 12 }}>
      <Ionicons name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}

const headerOpts = (title: string) => ({
  headerShown: true,
  title,
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.textPrimary,
  headerRight: () => <ThemeToggle />
});

function UserTabs() {
  const { theme } = useAuth();
  const tabs = [
    { key: 'Home', icon: 'home-outline', label: 'Home' },
    { key: 'Astrologers', icon: 'people-outline', label: 'Astrologers' },
    { key: 'Wallet', icon: 'wallet-outline', label: 'Wallet' },
    { key: 'Chat', icon: 'chatbubbles-outline', label: 'Chat' },
    { key: 'Profile', icon: 'person-outline', label: 'Profile' },
  ];
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingBottomBar tabs={tabs} activeTab={props.state.routeNames[props.state.index]} onTabPress={(key) => props.navigation.navigate(key)} />}
    >
      <Tab.Screen name="Home" component={UserHomeScreen} />
      <Tab.Screen name="Astrologers" component={AstrologerListScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AstrologerTabs() {
  const { theme } = useAuth();
  const tabs = [
    { key: 'Home', icon: 'home-outline', label: 'Home' },
    { key: 'Requests', icon: 'people-outline', label: 'Requests' },
    { key: 'Wallet', icon: 'wallet-outline', label: 'Wallet' },
    { key: 'Chat', icon: 'chatbubbles-outline', label: 'Chat' },
    { key: 'Profile', icon: 'person-outline', label: 'Profile' },
  ];
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingBottomBar tabs={tabs} activeTab={props.state.routeNames[props.state.index]} onTabPress={(key) => props.navigation.navigate(key)} />}
    >
      <Tab.Screen name="Home" component={AstrologerHomeScreen} />
      <Tab.Screen name="Requests" component={AstrologerRequestsScreen} />
      <Tab.Screen name="Wallet" component={AstrologerWalletScreen} />
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={AstrologerProfileScreen} />
    </Tab.Navigator>
  );
}

export function Navigation() {
  const { role, loading, theme } = useAuth();
  if (loading) return null;

  const screenOptions = { headerShown: false, contentStyle: { backgroundColor: colors.background } };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!role ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OtpLogin" component={OtpLoginScreen} />
          </>
        ) : role === 'user' ? (
          <>
            <Stack.Screen name="Main" component={UserTabs} />
            <Stack.Screen name="AstrologerList" component={AstrologerListScreen} />
            <Stack.Screen name="AstrologerDetail" component={AstrologerDetailScreen} options={headerOpts('Astrologer')} />
            <Stack.Screen name="Kundli" component={KundliScreen} options={headerOpts('Kundli')} />
            <Stack.Screen name="Matchmaking" component={MatchmakingScreen} options={headerOpts('Matchmaking')} />
            <Stack.Screen name="Panchang" component={PanchangScreen} options={headerOpts('Panchang')} />
            <Stack.Screen name="Shop" component={ShopScreen} options={headerOpts('Shop')} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={headerOpts('Orders')} />
            <Stack.Screen name="Videos" component={VideosScreen} options={headerOpts('Videos')} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={headerOpts('Notifications')} />
            <Stack.Screen name="Blogs" component={BlogsScreen} options={headerOpts('Blogs')} />
            <Stack.Screen name="Support" component={SupportScreen} options={headerOpts('Support')} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={headerOpts('Edit Profile')} />
            <Stack.Screen name="MandirPooja" component={MandirPoojaScreen} options={headerOpts('Mandir Pooja')} />
            <Stack.Screen name="Donation" component={DonationScreen} options={headerOpts('Donation')} />
            <Stack.Screen name="Report" component={ReportScreen} options={headerOpts('Report')} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={headerOpts('Privacy Policy')} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} options={headerOpts('Terms & Conditions')} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} options={headerOpts('About App')} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={headerOpts('Chat')} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={AstrologerTabs} />
            <Stack.Screen name="Schedule" component={AstrologerScheduleScreen} options={headerOpts('Schedule')} />
            <Stack.Screen name="Documents" component={AstrologerDocumentsScreen} options={headerOpts('Documents')} />
            <Stack.Screen name="CommissionLogs" component={AstrologerCommissionScreen} options={headerOpts('Commissions')} />
            <Stack.Screen name="GoLive" component={AstrologerGoLiveScreen} options={headerOpts('Go Live')} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={headerOpts('Edit Profile')} />
            <Stack.Screen name="Support" component={SupportScreen} options={headerOpts('Support')} />
            <Stack.Screen name="Notifications" component={AstrologerNotificationsScreen} options={headerOpts('Notifications')} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={headerOpts('Privacy Policy')} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} options={headerOpts('Terms & Conditions')} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} options={headerOpts('About App')} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={headerOpts('Chat')} />
            <Stack.Screen name="Withdrawals" component={AstrologerWithdrawalScreen} options={headerOpts('Withdrawals')} />
            <Stack.Screen name="Reviews" component={AstrologerReviewsScreen} options={headerOpts('Ratings & Reviews')} />
            <Stack.Screen name="Consultations" component={AstrologerConsultationScreen} options={headerOpts('Consultation History')} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
