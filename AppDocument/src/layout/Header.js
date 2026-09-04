import React from "react";
import { Bell } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Header = ({title}) => {
  const navigation = useNavigation();

  return (
    <View className="py-6 px-5 bg-white border-b border-gray-200 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-bold">{title}</Text>
        
      
      </View>
    </View>
  );
};

export default Header;