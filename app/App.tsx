import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Navigation } from './src/navigation/Navigation';
import { darkTheme, lightTheme, setThemeState } from './src/shared';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user, astrologer, role } = useAuth();
  const profile = role === 'astrologer' ? astrologer : user;
  const themeMode = (profile?.theme === 'light') ? 'light' : 'dark';

  useEffect(() => {
    setThemeState(themeMode);
  }, [themeMode]);

  const activeTheme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <PaperProvider theme={activeTheme}>
      {children}
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeWrapper>
          <Navigation />
        </ThemeWrapper>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
