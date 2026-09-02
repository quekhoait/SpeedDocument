import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { FileText, ShieldCheck, ArrowRight } from "lucide-react-native";

const TemplateItem = ({name, description, category, onPress, onHandle}) => {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm w-full my-2">
      <View className="flex-row justify-between items-center mb-3">
        <View className="w-11 h-11 bg-blue-100 rounded-xl items-center justify-center">
          <FileText size={22} color="#1d4ed8" />
        </View>
      </View>

      {/* Content */}
      <TouchableOpacity onPress={onHandle}>
 <Text className="text-xl font-bold text-slate-800 mb-1.5">
        {name}
      </Text>
      </TouchableOpacity>
     
      <Text className="text-sm text-gray-500 leading-5 mb-4">
        {description}
      </Text>

      <View className="pt-3 border-t border-gray-100 flex-row justify-between items-center">
        <Text className="text-xs text-gray-400 font-medium">
          {category}
        </Text>

        <TouchableOpacity 
          onPress={onPress}
          className="flex-row items-center active:opacity-60"
        >
          <Text className="text-xs font-semibold text-slate-800 mr-1">
            Xem chi tiết
          </Text>
          <ArrowRight size={14} color="#1e293b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TemplateItem;