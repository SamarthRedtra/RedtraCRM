import {SafeAreaProvider} from 'react-native-safe-area-context';
import Body from "./Body";
import {StatusBar} from 'expo-status-bar'
export default function App() {
  return (
    <>
    <StatusBar/>
    <SafeAreaProvider>
        <Body/>
    </SafeAreaProvider>
    </>
  );
}

