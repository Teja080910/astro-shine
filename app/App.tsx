import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { CallProvider, useCall } from './src/context/CallContext';
import { Navigation } from './src/navigation/Navigation';
import { IncomingCallScreen } from './src/screens/shared/IncomingCallScreen';
import { ActiveCallScreen } from './src/screens/shared/ActiveCallScreen';
import { darkTheme, lightTheme, setThemeState, GlobalAlert } from './src/shared';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useAuth();
  setThemeState(theme);
  const activeTheme = theme === 'light' ? lightTheme : darkTheme;
  return (
    <PaperProvider theme={activeTheme}>
      {children}
    </PaperProvider>
  );
}

function AppContent() {
  const { incomingCall, callState } = useCall();
  const showActive = callState === 'calling' || callState === 'active' || callState === 'ended';
  return (
    <View style={{ flex: 1 }}>
      <Navigation />
      {incomingCall && <IncomingCallScreen />}
      {showActive && <ActiveCallScreen />}
      <GlobalAlert />
    </View>
  );
}

export default function App() {
  return (
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <ChatProvider>
              <CallProvider>
                <ThemeWrapper>
                  <AppContent />
                </ThemeWrapper>
              </CallProvider>
            </ChatProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
  );
}
