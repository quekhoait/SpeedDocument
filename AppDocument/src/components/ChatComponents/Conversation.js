import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { HelpCircle, CornerDownLeft, Bot, User } from 'lucide-react-native';

const Conversation = ({ conversation = [], missingFieldsCount = 0, onSavePrompt, loading }) => {
  if (!conversation || conversation.length === 0) return null;

  return (
    <View className="bg-teal-50/70 rounded-2xl p-4 border border-teal-100 mb-4 shadow-sm">
      <View className="flex-row items-center mb-3">
        <HelpCircle size={18} color="#0d9488" />
        <Text className="text-teal-900 font-bold text-sm ml-2">
          Hội thoại làm rõ {missingFieldsCount > 0 && `(Còn ${missingFieldsCount} mục)`}
        </Text>
      </View>

      <View className="space-y-3">
        {conversation.map((item, index) => {
          const sender = item.sender || item.senderType;
          const textContent = item.content || item.message || item.text || '';

          if (!textContent.trim()) return null;
          const isAI = sender === 'ai_question' || sender === 'ai';

          return (
            <View key={item.id || index} className="my-1">
              {isAI ? (
                <View className="flex-row items-start space-x-2">
                  <View className="w-7 h-7 rounded-full bg-teal-600 items-center justify-center mt-1 mr-2">
                    <Bot size={16} color="#ffffff" />
                  </View>
                  <View className="bg-white p-3.5 rounded-2xl rounded-tl-sm border border-teal-100 flex-1 shadow-2xs">
                    <Text className="text-slate-800 text-sm leading-5">
                      {textContent}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="flex-row items-start justify-end space-x-2">
                  <View className="bg-teal-600 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[82%] shadow-2xs mr-2">
                    <Text className="text-white text-sm font-medium leading-5">
                      {textContent}
                    </Text>
                  </View>
                  <View className="w-7 h-7 rounded-full bg-slate-300 items-center justify-center mt-1">
                    <User size={16} color="#475569" />
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onSavePrompt}
        activeOpacity={0.7}
        disabled={loading}
        className="flex-row items-center justify-center py-2.5 px-4 rounded-xl bg-teal-100 border border-teal-200 mt-4"
      >
        <CornerDownLeft size={16} color="#0d9488" />
        <Text className="text-teal-800 font-semibold text-sm ml-2">
          Ghi nhận thông tin vào bản nháp
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Conversation;