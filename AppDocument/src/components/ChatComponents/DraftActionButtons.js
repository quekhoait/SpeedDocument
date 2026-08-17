import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';

const DraftActionBtn = ({ loading, documentId, onProcessAI, onSkip }) => {
  return (
    <View className="space-y-3 mb-4 pt-2">
      <TouchableOpacity
        onPress={onProcessAI}
        activeOpacity={0.8}
        disabled={loading}
        className={`flex-row items-center justify-center py-3.5 px-6 rounded-2xl shadow-sm ${
          loading ? 'bg-teal-400' : 'bg-teal-600'
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <>
            <Sparkles size={18} color="#ffffff" />
            <Text className="text-white font-bold text-base ml-2">
              {documentId ? 'Gửi câu trả lời cho AI' : 'Khởi tạo văn bản ngay'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSkip}
        activeOpacity={0.7}
        disabled={loading}
        className="flex-row items-center justify-center py-3 px-6 rounded-2xl bg-slate-100 border border-slate-200"
      >
        <ArrowRight size={18} color="#475569" />
        <Text className="text-slate-700 font-semibold text-sm ml-2">
          Bỏ Qua & Xem Phác Thảo
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default DraftActionBtn;