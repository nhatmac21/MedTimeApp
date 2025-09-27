import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <RootNavigator />
    </View>
  );
}
