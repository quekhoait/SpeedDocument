import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Base from '../layout/Base';
import { saveChatMessage, subscribeChatMessages } from '../services/FireBaseServices';
import { documentServices } from '../services/documentServices';

const DraftScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [documentId, setDocumentId] = useState(route.params?.documentId || null);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [, setIsComplete] = useState(false);

  const flatListRef = useRef(null);

  // Lắng nghe realtime tin nhắn từ Firestore khi đã có documentId
  useEffect(() => {
    if (!documentId) return;

    const unsubscribe = subscribeChatMessages(documentId, (messages) => {
      setConversation(messages || []);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [documentId]);

  const getToken = async () => {
    return await AsyncStorage.getItem('access_token');
  };

  const handleProcessAI = async () => {
    const promptToSend = inputText.trim();
    if (!promptToSend) {
      Alert.alert('Thông báo', 'Vui lòng nhập mô tả hoặc câu trả lời trước khi gửi.');
      return;
    }

    setLoading(true);
    setInputText('');

    const tempUserMsg = {
      id: Date.now().toString(),
      type: 'user_answer',
      content: promptToSend,
      createdAt: new Date(),
    };
    setConversation((prev) => [...prev, tempUserMsg]);

    try {
      if (documentId) {
        await saveChatMessage(documentId, 'user_answer', promptToSend);
      }

      const token = await getToken();
      const response = await documentServices.createDocument(token, {
        documentId: documentId,
        prompt: promptToSend,
      });

      const resData = response?.data;
      const currentDocId = resData?.documentId || resData?.id || documentId;

      if (!documentId && currentDocId) {
        setDocumentId(currentDocId);
        await saveChatMessage(currentDocId, 'user_answer', promptToSend);
      }

      let aiMessage = resData?.message;
      if (!aiMessage) {
        if (resData?.status === 'NEED_DOCUMENT_TYPE') {
          aiMessage = 'Tôi chưa xác định được loại văn bản bạn muốn tạo. Vui lòng mô tả rõ hơn.';
        } else if (resData?.status === 'OK') {
          aiMessage = 'Đã nhận được thông tin và đang tiến hành xử lý.';
        } else {
          aiMessage = 'Hệ thống đang xử lý yêu cầu của bạn.';
        }
      }

      if (currentDocId && aiMessage) {
        await saveChatMessage(currentDocId, 'ai_question', aiMessage);
      }

      if (resData && resData.status === 'OK') {
        setIsComplete(resData.isComplete);
        setMissingFields(resData.missingFields || []);

        if (resData.isComplete) {
          Alert.alert('Thành công', 'Đã thu thập đủ thông tin để tạo văn bản!', [
            {
              text: 'Xem trước',
              onPress: () => navigation.navigate('PreviewScreen', { documentId: currentDocId }),
            },
            { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
          ]);
        }
      } else {
        // Trường hợp backend trả về lỗi nghiệp vụ (thiếu trường, không nhận diện được loại văn bản...)
        if (resData?.missingFields) {
          setMissingFields(resData.missingFields);
        }
      }
    } catch (error) {
      console.error('Lỗi Process AI:', error);
      const errMsg = error.response?.data?.message || 'Đã có lỗi xảy ra trong quá trình xử lý với AI.';
      if (documentId) {
        await saveChatMessage(documentId, 'ai_question', errMsg).catch(console.error);
      }
      Alert.alert('Lỗi', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToPreview = () => {
    if (documentId) {
      navigation.navigate('PreviewScreen', { documentId });
    } else {
      Alert.alert('Thông báo', 'Vui lòng gửi thông tin để khởi tạo văn bản trước.');
    }
  };

  const renderChatItem = ({ item }) => {
    const isUser = item.type === 'user_answer' || item.sender === 'user';
    return (
      <View className={`my-1.5 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
        <View
          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 rounded-tr-none'
              : 'bg-slate-100 border border-slate-200 rounded-tl-none'
          }`}
        >
          <Text className={`text-base leading-5 ${isUser ? 'text-white font-medium' : 'text-slate-800'}`}>
            {item.content || item.message}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Base hasHeader={false} activeTab={1} headerTitle="SOẠN THẢO AI">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-4 py-3">
          {/* Header Title */}
          <Text className="text-slate-800 text-2xl font-bold text-center mb-3 mt-1">
            Soạn thảo với AI
          </Text>

          {/* Ô INPUT Ở TRÊN CÙNG */}
          <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 shadow-xs min-h-[110px] mb-3">
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

          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={handleProcessAI}
              disabled={loading || !inputText.trim()}
              className={`flex-1 py-3 rounded-xl items-center justify-center ${
                loading || !inputText.trim() ? 'bg-slate-300' : 'bg-blue-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">Gửi yêu cầu</Text>
              )}
            </TouchableOpacity>

        
          </View>

          {missingFields.length > 0 && (
            <View className="mb-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
              <Text className="text-amber-700 text-xs font-semibold">
                Còn thiếu {missingFields.length} thông tin cần bổ sung
              </Text>
            </View>
          )}

          <View className="flex-1 border-t border-slate-200 pt-2">
            <Text className="text-slate-500 font-semibold text-xs mb-2">Hội thoại:</Text>
            <FlatList
              ref={flatListRef}
              data={conversation}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={renderChatItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={
                <View className="py-8 items-center justify-center">
                  <Text className="text-slate-400 text-center text-sm">
                    Chưa có hội thoại nào. Nhập thông tin ở trên để bắt đầu soạn thảo.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Base>
  );
};

export default DraftScreen;