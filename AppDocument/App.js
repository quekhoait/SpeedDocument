import "./global.css";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
   <View className="flex-1 items-center justify-center bg-blue-500">
      <Text className="text-3xl font-bold text-red-800">
        SpeedDocument
      </Text>

      <Text className="mt-4 text-lg text-white">
        NativeWind hoạt động!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
