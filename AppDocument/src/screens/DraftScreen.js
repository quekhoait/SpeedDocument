import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Sparkles, HelpCircle, ArrowRight, CornerDownLeft, CheckCircle2, History } from 'lucide-react-native';
import Base from '../layout/Base';
import { documentServices } from '../services/documentServices';

const DraftScreen = ({ navigation }) => {
  const [inputText, setInputText] = useState('');  
  const [userInputs, setUserInputs] = useState([]);
  const [conversation, setConversation] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleSendResponse = () => {
    if (!inputText.trim()) return;
    const trimmedText = inputText.trim();
    setUserInputs((prev) => [...prev, trimmedText]);
    setConversation((prev) => [
      ...prev,
      { id: Date.now().toString(), type: 'user_answer', text: trimmedText },
    ]);
    setInputText('');
  };

const handleProcessAI = async () => {
    let promptToSend = inputText.trim();

    // 1. Kiểm tra đầu vào
    if (!promptToSend && userInputs.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập mô tả hoặc câu trả lời trước khi gửi.');
      return;
    }

    setLoading(true);

    try {
      // 2. Cập nhật câu thoại người dùng trên UI trước khi gửi
      if (promptToSend) {
        setUserInputs((prev) => [...prev, promptToSend]);
        setConversation((prev) => [
          ...prev,
          { id: Date.now().toString(), type: 'user_answer', text: promptToSend },
        ]);
        setInputText('');
      } else {
        // Nếu inputText trống nhưng đã từng nhập, lấy câu nhập gần nhất để gửi lại context
        promptToSend = userInputs[userInputs.length - 1] || '';
      }

      // 3. Gọi API
      const response = await documentServices.createDocument({
        documentId: documentId || null,
        prompt: promptToSend, 
      });

      // Bóc tách dữ liệu thực sự từ Axios Response
      const resData = response?.data || response;

      console.log("Dữ liệu nhận được:", resData);

      // 4. Xử lý phản hồi từ Server
      if (resData && (resData.status === 'OK' || resData.documentId)) {
        // Cập nhật documentId & isComplete
        setDocumentId(resData.documentId);
        setIsComplete(resData.isComplete);
        
        // TRƯỜNG HỢP A: ĐÃ ĐỦ THÔNG TIN
        if (resData.isComplete) {
          Alert.alert('Thành công', 'Đã thu thập đủ thông tin để tạo văn bản!', [
            {
              text: 'Xem trước',
              onPress: () => navigation?.navigate('PreviewScreen', { documentId: resData.documentId }),
            },
          ]);
        } 
        else {
          setMissingFields(resData.missingFields || []);

          if (resData.message) {
            setConversation((prev) => [
              ...prev,
              {
                id: (Date.now() + 1).toString(),
                type: 'ai_question',
                text: resData.message,
              },
            ]);
          }
        }
      } else {
        Alert.alert('Lỗi', resData?.message || 'Không thể xử lý yêu cầu.');
      }
    } catch (error) {
      console.error('Lỗi Process AI:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra trong quá trình xử lý với AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Base hasHeader={false} activeTab={1} headerTitle="SOẠN THẢO AI">
      <View className="flex-1 px-6 py-4 justify-between">
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <Text className="text-gray-900 text-2xl font-bold text-center mb-6 mt-2">
            Soạn thảo với AI
          </Text>

          <View className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm min-h-[120px] mb-4">
            <TextInput
              multiline
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập mô tả hoặc câu trả lời cho AI..."
              placeholderTextColor="#94a3b8"
              className="text-slate-700 text-base leading-6 font-medium flex-1"
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          {conversation.length > 0 && (
            <View className="bg-teal-50/60 rounded-2xl p-4 border border-teal-100 mb-4">
              <View className="flex-row items-center mb-2">
                <HelpCircle size={18} color="#0d9488" />
                <Text className="text-teal-800 font-bold text-sm ml-2">
                  AI cần làm rõ {missingFields.length > 0 && `(${missingFields.length} mục)`}
                </Text>
              </View>

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

              <TouchableOpacity
                onPress={handleSendResponse}
                activeOpacity={0.7}
                disabled={loading}
                className="flex-row items-center justify-center py-2.5 px-4 rounded-xl bg-teal-100 border border-teal-200 mt-2"
              >
                <CornerDownLeft size={16} color="#0d9488" />
                <Text className="text-teal-700 font-semibold text-sm ml-2">
                  Cập nhật thông tin vào danh sách
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
        </ScrollView>

        <View className="space-y-3 mb-4 pt-2">
          <TouchableOpacity
            onPress={handleProcessAI}
            activeOpacity={0.8}
            disabled={loading}
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl bg-teal-600 shadow-sm"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Sparkles size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base ml-2">
                  {documentId ? 'Gửi câu trả lời cho AI' : 'Tạo văn bản ngay'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (documentId) {
                navigation?.navigate('PreviewScreen', { documentId });
              } else {
                Alert.alert('Thông báo', 'Vui lòng bấm Tạo văn bản để khởi tạo.');
              }
            }}
            activeOpacity={0.7}
            disabled={loading}
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl bg-slate-100 border border-slate-200"
          >
            <ArrowRight size={20} color="#475569" />
            <Text className="text-slate-700 font-semibold text-base ml-2">
              Bỏ Qua & Xem Phác Thảo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Base>
  );
};

export default DraftScreen;