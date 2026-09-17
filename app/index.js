import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

if (Platform.OS !== 'web') {
  const { registerGlobals } = require('@livekit/react-native');
  registerGlobals();
}

registerRootComponent(App);
