import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Mic, Sparkles, StopCircle } from 'lucide-react-native';
import Base from '../layout/Base';

const VoiceAIScreen = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [transcript, setTranscript] = useState(
    'Tạo một tài liệu tóm tắt cuộc họp ngày hôm nay, bao gồm các điểm chính về tiến độ dự án Alpha, ngân sách marketing quý 3, và...'
  );

  const handleProcessAI = () => {
    console.log('Xử lý với AI:', transcript);
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
   
    <Base hasHeader={false} activeTab={1} headerTitle="GIỌNG NÓI AI">
      <View className="flex-1 px-6 py-4 justify-between">
        <View>

          <Text className="text-gray-900 text-2xl font-bold text-center mb-6 mt-2">
            {isRecording ? 'Đang lắng nghe...' : 'Đã dừng ghi âm'}
          </Text>

          <View className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm min-h-[180px]">
            <Text className="text-slate-700 text-base leading-7 font-medium">
              {transcript}
            </Text>

            {isRecording && (
              <Text className="text-teal-600 font-bold text-lg mt-1">|</Text>
            )}
          </View>
        </View>

        {/* Khối Micro */}
        <View className="items-center justify-center my-6">
          <View className="w-32 h-32 rounded-full border border-teal-200 items-center justify-center bg-teal-50">
            <View className="w-24 h-24 rounded-full border border-teal-300 items-center justify-center bg-teal-100/60 shadow-sm">
              <Mic size={36} color="#0d9488" />
            </View>
          </View>
        </View>

        {/* Khối nút bấm thao tác */}
        <View className="space-y-3 mb-4">
          <TouchableOpacity
            onPress={handleProcessAI}
            activeOpacity={0.8}
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl bg-teal-600 shadow-sm"
          >
            <Sparkles size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base ml-2">
              Tạo văn bản
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleRecording}
            activeOpacity={0.7}
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl bg-slate-100 border border-slate-200"
          >
            {isRecording ? (
              <>
                <StopCircle size={20} color="#ef4444" />
                <Text className="text-slate-700 font-semibold text-base ml-2">
                  Dừng Ghi Âm
                </Text>
              </>
            ) : (
              <>
                <Mic size={20} color="#0d9488" />
                <Text className="text-slate-700 font-semibold text-base ml-2">
                  Tiếp Tục Ghi Âm
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Base>
  );
};

export default VoiceAIScreen;