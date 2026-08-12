import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Sparkles, HelpCircle, ArrowRight, CornerDownLeft, CheckCircle2, History } from 'lucide-react-native';
import Base from '../layout/Base';

const DraftScreen = () => {
  const [inputText, setInputText] = useState('');
  
  // Danh sách lưu lại toàn bộ các thông tin/mô tả người dùng ĐÃ NHẬP
  const [userInputs, setUserInputs] = useState([
    'Tạo Hợp đồng Dịch vụ Marketing giữa Công ty A và Công ty B',
  ]);

  // Danh sách hội thoại hỏi đáp với AI
  const [conversation, setConversation] = useState([
    {
      id: '1',
      type: 'ai_question',
      text: 'Để hoàn thiện hợp đồng, bạn vui lòng cho biết Giá trị hợp đồng và Thời hạn thực hiện dự kiến?',
    },
  ]);

  // Xử lý gửi phản hồi / nhập thêm thông tin
  const handleSendResponse = () => {
    if (!inputText.trim()) return;

    // 1. Lưu nội dung vừa nhập vào danh sách ĐÃ NHẬP
    setUserInputs((prev) => [...prev, inputText.trim()]);

    // 2. Cập nhật vào hội thoại
    setConversation((prev) => [
      ...prev,
      { id: Date.now().toString(), type: 'user_answer', text: inputText.trim() },
    ]);

    setInputText('');
  };

  const handleProcessAI = () => {
    console.log('Tạo văn bản với danh sách dữ liệu đã nhập:', userInputs);
  };

  return (
    <Base hasHeader={false} activeTab={1} headerTitle="SOẠN THẢO AI">
      <View className="flex-1 px-6 py-4 justify-between">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Tiêu đề trang */}
          <Text className="text-gray-900 text-2xl font-bold text-center mb-6 mt-2">
            Soạn thảo với AI
          </Text>

          {/* Ô nhập liệu mô tả / bổ sung */}
          <View className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm min-h-[120px] mb-4">
            <TextInput
              multiline
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập mô tả hoặc câu trả lời cho AI..."
              placeholderTextColor="#94a3b8"
              className="text-slate-700 text-base leading-6 font-medium flex-1"
              textAlignVertical="top"
            />
          </View>

       

          {conversation.length > 0 && (
            <View className="bg-teal-50/60 rounded-2xl p-4 border border-teal-100 mb-4">
              <View className="flex-row items-center mb-2">
                <HelpCircle size={18} color="#0d9488" />
                <Text className="text-teal-800 font-bold text-sm ml-2">
                  AI cần làm rõ
                </Text>
              </View>

              {/* Lịch sử hỏi đáp */}
              {conversation.map((item) => (
                <View key={item.id} className="mb-2">
                  {item.type === 'ai_question' ? (
                    <Text className="text-slate-700 text-sm leading-6 bg-white p-3 rounded-xl border border-teal-100">
                      {item.text}
                    </Text>
                  ) : (
                    <View className="flex-row justify-end mt-1">
                      <View className="bg-teal-600 px-3 py-2 rounded-xl max-w-[85%]">
                        <Text className="text-white text-sm font-medium">
                          {item.text}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}

              {/* Nút gửi nội dung bổ sung */}
              <TouchableOpacity
                onPress={handleSendResponse}
                activeOpacity={0.7}
                className="flex-row items-center justify-center py-2.5 px-4 rounded-xl bg-teal-100 border border-teal-200 mt-2"
              >
                <CornerDownLeft size={16} color="#0d9488" />
                <Text className="text-teal-700 font-semibold text-sm ml-2">
                  Cập nhật thông tin vào danh sách
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

           {userInputs.length > 0 && (
            <View className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 mb-4">
              <View className="flex-row items-center mb-3">
                <History size={18} color="#475569" />
                <Text className="text-slate-700 font-bold text-sm ml-2">
                  Thông tin bạn đã cung cấp ({userInputs.length})
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
          )}

        {/* Khối nút bấm thao tác cố định ở đáy */}
        <View className="space-y-3 mb-4 pt-2">
          <TouchableOpacity
            onPress={handleProcessAI}
            activeOpacity={0.8}
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl bg-teal-600 shadow-sm"
          >
            <Sparkles size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base ml-2">
              Tạo văn bản ({userInputs.length} thông tin)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleProcessAI}
            activeOpacity={0.7}
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl bg-slate-100 border border-slate-200"
          >
            <ArrowRight size={20} color="#475569" />
            <Text className="text-slate-700 font-semibold text-base ml-2">
              Bỏ Qua & Bắt Đầu Phác Thảo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Base>
  );
};

export default DraftScreen;