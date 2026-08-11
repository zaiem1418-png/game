import { registerRootComponent } from 'expo';

import App from './App';

// LiveKit/WebRTC يتطلب registerGlobals() قبل أي استخدام للصوت. محميّ بـ try
// حتى يبقى التطبيق يُقلع في Expo Go (الصوت معطّل) لحين تثبيت @livekit/react-native
// وعمل Development Build.
try {
  require('@livekit/react-native').registerGlobals();
} catch {}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
