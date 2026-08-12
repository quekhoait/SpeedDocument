import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; 

const BackHeader = ({ title }) => {
  const navigation = useNavigation(); 

  return ( 
    <View className="bg-indigo-700 px-4 pt-4 pb-4  shadow-md">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-9 h-9 rounded-xl bg-indigo-900/40 items-center justify-center mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {title && (
            <Text className="text-white font-bold text-lg flex-1">
              {title}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default BackHeader;