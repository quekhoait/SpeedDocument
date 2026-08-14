import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';

const SignatureItem = ({ item, onDelete }) => {
  if (!item) return null;

  return (
    <View className="flex-row items-center justify-between p-3 mb-2 bg-slate-50 rounded-2xl border border-slate-200">
      <View className="flex-row items-center flex-1">
        <Image 
          source={{ uri: item.imageUri }} 
          className="w-20 h-10 resize-contain bg-white rounded-lg border border-slate-100" 
        />
        <Text className="text-slate-500 text-xs ml-3">
          Tạo lúc: {item.createdAt}
        </Text>
      </View>

      <TouchableOpacity onPress={onDelete} className="p-2">
        <Trash2 size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
};

export default SignatureItem;