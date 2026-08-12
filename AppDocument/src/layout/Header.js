import React from "react";
import { Bell } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Header = ({title}) => {
  const navigation = useNavigation();
  const notifications = [1, 2, 3];

  return (
    <View className="py-2 px-5 bg-white border-b border-gray-200 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-bold">{title}</Text>
        
        <TouchableOpacity 
          onPress={() => navigation.navigate("notification")} 
          className="relative p-3 bg-white rounded-2xl border border-gray-200 shadow-sm"
        >
          <Bell size={24} color="#374151" />

            <View className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-red-500 items-center justify-center px-1">
              <Text className="text-[10px] font-bold text-white">
                {notifications.length}
              </Text>
            </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;