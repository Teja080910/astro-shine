import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FloatingBottomBar, colors, typography } from '@astro-shine/shared-ui';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen, RegisterScreen, OtpLoginScreen } from '../screens/auth/AuthScreens';
import { UserHomeScreen, AstrologerListScreen, AstrologerDetailScreen, WalletScreen, ChatScreen, KundliScreen, MatchmakingScreen, ShopScreen, ProfileScreen } from '../screens/user/UserScreens';
import { AstrologerHomeScreen, AstrologerWalletScreen, AstrologerProfileScreen } from '../screens/astrologer/AstrologerScreens';
import {
  PanchangScreen, BlogsScreen, NotificationsScreen, EditProfileScreen, SupportScreen,
  DonationScreen, ReportScreen, MandirPoojaScreen, OrderHistoryScreen,
  AstrologerRequestsScreen, AstrologerScheduleScreen, AstrologerDocumentsScreen,
  AstrologerCommissionScreen, AstrologerGoLiveScreen,
} from '../screens/shared/SharedScreens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerOpts = (title: string) => ({ headerShown: true, title, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white });

function UserTabs() {
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
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AstrologerTabs() {
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
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={AstrologerProfileScreen} />
    </Tab.Navigator>
  );
}

export function Navigation() {
  const { role, loading } = useAuth();
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
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={headerOpts('Notifications')} />
            <Stack.Screen name="Blogs" component={BlogsScreen} options={headerOpts('Blogs')} />
            <Stack.Screen name="Support" component={SupportScreen} options={headerOpts('Support')} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={headerOpts('Edit Profile')} />
            <Stack.Screen name="MandirPooja" component={MandirPoojaScreen} options={headerOpts('Mandir Pooja')} />
            <Stack.Screen name="Donation" component={DonationScreen} options={headerOpts('Donation')} />
            <Stack.Screen name="Report" component={ReportScreen} options={headerOpts('Report')} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={AstrologerTabs} />
            <Stack.Screen name="Schedule" component={AstrologerScheduleScreen} options={headerOpts('Schedule')} />
            <Stack.Screen name="Documents" component={AstrologerDocumentsScreen} options={headerOpts('Documents')} />
            <Stack.Screen name="CommissionLogs" component={AstrologerCommissionScreen} options={headerOpts('Commissions')} />
            <Stack.Screen name="GoLive" component={AstrologerGoLiveScreen} options={headerOpts('Go Live')} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
