import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './navigation/Navigation';
import { darkTheme } from '@astro-shine/shared-ui';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={darkTheme}>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
