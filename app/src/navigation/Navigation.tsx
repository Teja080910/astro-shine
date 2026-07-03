import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FloatingBottomBar, colors } from '@astro-shine/shared-ui';
import { useAuth, AppRole } from '../context/AuthContext';

import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen, RegisterScreen, OtpLoginScreen } from '../screens/auth/AuthScreens';
import { UserHomeScreen, AstrologerListScreen, AstrologerDetailScreen, WalletScreen, ChatScreen, KundliScreen, MatchmakingScreen, ShopScreen, ProfileScreen } from '../screens/user/UserScreens';
import { AstrologerHomeScreen, AstrologerWalletScreen, AstrologerProfileScreen } from '../screens/astrologer/AstrologerScreens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
      <Tab.Screen name="Requests" component={PlaceholderScreen} />
      <Tab.Screen name="Wallet" component={AstrologerWalletScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={AstrologerProfileScreen} />
    </Tab.Navigator>
  );
}

import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '@astro-shine/shared-ui';
function PlaceholderScreen({ route }: any) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><Ionicons name="construct-outline" size={48} color={colors.textMuted} /><Text style={[typography.pageTitle, { marginTop: 12 }]}>{route?.name || 'Screen'}</Text><Text style={typography.body}>Coming soon</Text></View>;
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
            <Stack.Screen name="AstrologerDetail" component={AstrologerDetailScreen} options={{ headerShown: true, title: 'Astrologer', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Kundli" component={KundliScreen} options={{ headerShown: true, title: 'Kundli', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Matchmaking" component={MatchmakingScreen} options={{ headerShown: true, title: 'Matchmaking', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Panchang" component={PlaceholderScreen} options={{ headerShown: true, title: 'Panchang', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Shop" component={ShopScreen} options={{ headerShown: true, title: 'Shop', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="OrderHistory" component={PlaceholderScreen} options={{ headerShown: true, title: 'Orders', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Notifications" component={PlaceholderScreen} options={{ headerShown: true, title: 'Notifications', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Blogs" component={PlaceholderScreen} options={{ headerShown: true, title: 'Blogs', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Support" component={PlaceholderScreen} options={{ headerShown: true, title: 'Support', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="EditProfile" component={PlaceholderScreen} options={{ headerShown: true, title: 'Edit Profile', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="MandirPooja" component={PlaceholderScreen} options={{ headerShown: true, title: 'Mandir Pooja', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Donation" component={PlaceholderScreen} options={{ headerShown: true, title: 'Donation', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Report" component={PlaceholderScreen} options={{ headerShown: true, title: 'Report', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={AstrologerTabs} />
            <Stack.Screen name="Schedule" component={PlaceholderScreen} options={{ headerShown: true, title: 'Schedule', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="Documents" component={PlaceholderScreen} options={{ headerShown: true, title: 'Documents', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="CommissionLogs" component={PlaceholderScreen} options={{ headerShown: true, title: 'Commissions', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
            <Stack.Screen name="GoLive" component={PlaceholderScreen} options={{ headerShown: true, title: 'Go Live', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.white }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
