import "./global.css";
import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import Base from "./src/layout/Base";
import RegisterScreen from "./src/screens/RegisScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CreateDocumentScreen from "./src/screens/CreateDocument";
import VoiceAIScreen from "./src/screens/VoiceScreen";
import DraftScreen from "./src/screens/DraftScreen";
import SignatureScreen from "./src/screens/SignatureScreen";
import { AuthProvider } from "./src/context/AuthContext";
import PreviewScreen from "./src/screens/PreviewScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="regis"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="create-document"
        component={CreateDocumentScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="voice"
        component={VoiceAIScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="draft"
        component={DraftScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="signature"
        component={SignatureScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="preview"
        component={PreviewScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="profile"
        component={ProfileScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
