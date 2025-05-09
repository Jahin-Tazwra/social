import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <Slot />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
