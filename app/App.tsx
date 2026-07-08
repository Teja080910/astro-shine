import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { Navigation } from './src/navigation/Navigation';
import { darkTheme, lightTheme, setThemeState } from './src/shared';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useAuth();

  // Set the theme state synchronously during render to guarantee correct values!
  setThemeState(theme);

  const activeTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <PaperProvider theme={activeTheme}>
      {children}
    </PaperProvider>
  );
}

function NavigationContent() {
  return <Navigation />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ChatProvider>
          <ThemeWrapper>
            <NavigationContent />
          </ThemeWrapper>
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
