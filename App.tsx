import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <RootNavigator />
      </View>
    </SafeAreaProvider>
  );
}
