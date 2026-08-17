import React from 'react';
import { View, Text } from 'react-native';
import { History, CheckCircle2 } from 'lucide-react-native';

const HistoryInput = ({ userInputs = [] }) => {
  if (userInputs.length === 0) return null;

  return (
    <View className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 mb-4">
      <View className="flex-row items-center mb-3">
        <History size={16} color="#475569" />
        <Text className="text-slate-700 font-bold text-sm ml-2">
          Nội dung bạn đã cung cấp ({userInputs.length})
        </Text>
      </View>

      <View className="space-y-2">
        {userInputs.map((item, index) => (
          <View
            key={index}
            className="flex-row items-start bg-white p-3 rounded-xl border border-slate-200/60 my-0.5"
          >
            <CheckCircle2 size={16} color="#0d9488" className="mt-0.5 mr-2" />
            <Text className="text-slate-700 text-sm font-medium flex-1 leading-5">
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default HistoryInput;