import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { Mic, Send, StopCircle, Eye, CheckCircle2 } from "lucide-react-native";
import Base from "../layout/Base";
import { documentServices } from "../services/documentServices";
import {
  saveChatMessage,
  subscribeChatMessages,
  migrateSessionMessages,
} from "../services/FireBaseServices";
import { templateService } from "../services/templateServices";
import {
  generateSpeechFromMissingFields,
  speakResponse,
  speakWithGoogleAPI,
  speakWithOpenAI,
  stopSpeech,
} from "../services/AIServices";

const genSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const VoiceAIScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);

  const [selectedTemplate] = useState(route.params?.template || null);
  const [documentId, setDocumentId] = useState(
    route.params?.documentId ? String(route.params.documentId) : null
  );
  const [sessionId, setSessionId] = useState(
    route.params?.documentId
      ? String(route.params.documentId)
      : genSessionId()
  );

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [conversation, setConversation] = useState([]);
  const [inputText, setInputText] = useState("");
  const [missingFields, setMissingFields] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [document, setDocument] = useState(null);

  const [currentPhase, setCurrentPhase] = useState("FILLING_DATA");
  const [dynamicTemplateData, setDynamicTemplateData] = useState(null);
  const [dynamicFileUrl, setDynamicFileUrl] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Thông báo", "Ứng dụng cần quyền Microphone để ghi âm.");
          return;
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      } catch (err) {
        console.error("Lỗi Microphone:", err);
      }
    })();

    return () => {
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribeChatMessages(sessionId, (messages) => {
      if (messages && messages.length > 0) {
        setConversation(messages);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sessionId]);

  const getToken = async () => await AsyncStorage.getItem("access_token");

  // Hàm xử lý tạo prompt & gọi API TTS để đọc thành tiếng
  const handleSpeakResponse = async (fields = [], complete = false) => {
    try {
      const textToSpeak = await generateSpeechFromMissingFields(fields, complete);
      console.log("Nội dung AI chuẩn bị đọc:", textToSpeak);
      await speakWithOpenAI(textToSpeak);
    } catch (err) {
      console.error("Lỗi phát giọng nói:", err);
    }
  };

  const startRecording = async () => {
    try {
      if (isProcessing) return;
      stopSpeech();

      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return Alert.alert("Thông báo", "Chưa cấp quyền microphone.");

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error("Lỗi bắt đầu ghi âm:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      await audioRecorder.stop();
      if (!audioRecorder.uri) throw new Error("File ghi âm không tồn tại.");

      const res = await documentServices.speedToText(audioRecorder.uri);
      const resText = res?.data?.data?.text || "";

      if (resText.trim()) {
        setInputText((prev) => (prev ? `${prev} ${resText}` : resText));
      } else {
        Alert.alert("Thông báo", "Không nhận diện được nội dung giọng nói.");
      }
    } catch (err) {
      console.error("Lỗi Speech-to-text:", err);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi xử lý giọng nói.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRec = () => (isRecording ? stopRecording() : startRecording());

  const handleSaveTemplate = async () => {
    if (!dynamicTemplateData || savingTemplate) return;
    setSavingTemplate(true);
    try {
      const token = await getToken();
      const payload = {
        documentId,
        categoryId: 1,
        name: dynamicTemplateData.name || dynamicTemplateData.title,
        description: dynamicTemplateData.description || "",
        fields: dynamicTemplateData.fields || [],
        urlCloud: dynamicFileUrl,
      };

      const res = await templateService.createTemplate(token, payload);
      if (res?.data?.status === "OK" || [200, 201].includes(res?.status)) {
        setCurrentPhase("FILLING_DATA");

        await saveChatMessage(
          sessionId,
          "system_info",
          `✅ Mẫu "${payload.name}" đã được lưu thành công!`,
          []
        );

        const fieldsToAsk = (payload.fields || []).map((f) => ({
          field_key: f.field_key,
          field_label: f.field_label || f.name,
          question: f.question,
        }));
        setMissingFields(fieldsToAsk);

        handleSpeakResponse(fieldsToAsk, false);

        await saveChatMessage(
          sessionId,
          "ai_question",
          `Bắt đầu điền thông tin vào văn bản:\n` +
            fieldsToAsk.map((f) => `- ${f.question || f.field_label}`).join("\n"),
          fieldsToAsk
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể lưu template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleProcessAI = async () => {
    const prompt = inputText.trim();
    if (!prompt || isProcessing || isRecording) return;

    stopSpeech();
    setIsProcessing(true);
    setInputText("");
    const currSession = sessionId;

    try {
      await saveChatMessage(currSession, "user_answer", prompt, []);

      const token = await getToken();
      const payload = { prompt };
      if (documentId && documentId !== "null") payload.documentId = documentId;
      if (selectedTemplate?.id) payload.templateId = selectedTemplate.id;

      const res = await documentServices.createDocument(token, payload);

      const data = res?.data;
      const currDocId = data?.documentId ? String(data.documentId) : documentId;

      if (!documentId && currDocId) {
        await migrateSessionMessages(currSession, currDocId);
        setDocumentId(currDocId);
        setSessionId(currDocId);
      }

      const activeSession = currDocId || currSession;
      const phase = data?.phase || "FILLING_DATA";
      setCurrentPhase(phase);

      if (phase === "TEMPLATE_DRAFTING") {
        setDynamicTemplateData(data.templateData);
        setDynamicFileUrl(data.fileUrl);
        speakWithGoogleAPI("Đã cập nhật bản nháp mẫu. Bạn có thể nói tiếp để chỉnh sửa hoặc bấm lưu mẫu.");
      } else {
        const currentMissing = data?.missingFields || [];
        setMissingFields(currentMissing);
        const done = Boolean(
          data?.isComplete && (data?.status === "OK" || data?.status === 200)
        );
        setIsComplete(done);
        if (done) setDocument(data?.document || data);

        await handleSpeakResponse(currentMissing, done);
      }

      await saveChatMessage(
        activeSession,
        "ai_question",
        data?.message || "Đã nhận được thông tin và đang xử lý.",
        data?.missingFields || []
      );
    } catch (err) {
      const responseData = err?.response?.data;
      const errMsg = responseData?.message || "Đã có lỗi xảy ra khi AI xử lý.";

      if (responseData?.status === "NEED_DOCUMENT_TYPE") {
        await saveChatMessage(currSession, "ai_question", errMsg, []);
        await speakWithGoogleAPI(errMsg);
        return;
      }

      console.error("Lỗi Process AI:", err);
      speakWithGoogleAPI(errMsg);
      await saveChatMessage(currSession, "ai_question", errMsg, []);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderChatItem = ({ item, index }) => {
    const rawContent = item.content || item.message || "";
    const isUser = item.sender === "user_answer" || item.type === "user_answer";
    const isSystem = item.sender === "system_info" || item.type === "system_info";
    const isLast = index === conversation.length - 1;

    if (isSystem) {
      return (
        <View className="items-center my-2 px-4">
          <View className="bg-slate-100 px-3 py-1.5 rounded-full">
            <Text className="text-slate-600 text-xs font-medium text-center">
              {rawContent}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        className={`w-full flex-row px-3 my-1.5 ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {!isUser && (
          <View
            className={`w-7 h-7 rounded-full items-center justify-center mr-2 mt-1 ${
              currentPhase === "TEMPLATE_DRAFTING" ? "bg-amber-500" : "bg-teal-600"
            }`}
          >
            <Text className="text-white font-bold text-[10px]">
              {currentPhase === "TEMPLATE_DRAFTING" ? "⚙️" : "AI"}
            </Text>
          </View>
        )}

        <View className="max-w-[80%]">
          <View
            className={`p-3 rounded-2xl ${
              isUser
                ? "bg-teal-600 rounded-tr-none"
                : "bg-slate-100 rounded-tl-none"
            }`}
          >
            <Text
              className={`text-sm leading-5 ${
                isUser ? "text-white" : "text-slate-800"
              }`}
            >
              {rawContent}
            </Text>
          </View>

          {!isUser && isLast && currentPhase === "TEMPLATE_DRAFTING" && dynamicTemplateData && (
            <View className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <Text className="text-amber-800 font-bold text-xs mb-1">
                Bản nháp: {dynamicTemplateData.name || dynamicTemplateData.title}
              </Text>
              <Text className="text-amber-700 text-[11px] mb-2">
                Hãy nói hoặc nhập tiếp để sửa. Bấm nút bên dưới để chốt mẫu.
              </Text>
              <View className="flex-row gap-2">
                {dynamicFileUrl && (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("preview", {
                        previewUrl: dynamicFileUrl,
                        documentId,
                      })
                    }
                    className="flex-1 flex-row items-center justify-center bg-white border border-amber-400 py-1.5 rounded-lg"
                  >
                    <Eye size={12} color="#d97706" />
                    <Text className="text-amber-700 font-semibold text-xs ml-1">
                      Xem Word
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="flex-1 flex-row items-center justify-center bg-amber-500 py-1.5 rounded-lg"
                >
                  {savingTemplate ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <CheckCircle2 size={12} color="#fff" />
                      <Text className="text-white font-bold text-xs ml-1">Lưu mẫu</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isComplete && isLast && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("preview", {
                  documentId,
                  document,
                  previewUrl: document?.file_path || document?.fileUrl,
                })
              }
              className="mt-2 bg-emerald-600 px-3 py-2 rounded-xl flex-row items-center self-start"
            >
              <Text className="text-white font-bold text-xs">
                📄 Xem trước văn bản ngay
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Base hasHeader={false} activeTab={1} headerTitle="GIỌNG NÓI AI" hasNav={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-white"
      >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
          <View className="flex-row items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center mr-2.5 ${
                currentPhase === "TEMPLATE_DRAFTING" ? "bg-amber-500" : "bg-teal-600"
              }`}
            >
              <Text className="text-white text-xs font-bold">
                {currentPhase === "TEMPLATE_DRAFTING" ? "⚙️" : "AI"}
              </Text>
            </View>
            <View>
              <Text className="text-slate-800 text-sm font-bold">Trợ lý Giọng nói</Text>
              <Text
                className={`text-[10px] font-semibold ${
                  currentPhase === "TEMPLATE_DRAFTING" ? "text-amber-600" : "text-teal-600"
                }`}
              >
                {currentPhase === "TEMPLATE_DRAFTING"
                  ? "● Chỉnh sửa mẫu nháp"
                  : "● Điền thông tin văn bản"}
              </Text>
            </View>
          </View>
          {selectedTemplate && (
            <View className="bg-slate-100 px-2.5 py-1 rounded-full max-w-[130px]">
              <Text numberOfLines={1} className="text-slate-600 text-xs font-medium">
                {selectedTemplate.name}
              </Text>
            </View>
          )}
        </View>

        {/* 1. Ô INPUT TRÊN CÙNG */}
        <View className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <View className="bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm">
            <TextInput
              multiline
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                isRecording
                  ? "Đang lắng nghe giọng nói..."
                  : isProcessing
                  ? "Đang xử lý giọng nói..."
                  : "Nội dung nhận diện sẽ hiển thị ở đây để chỉnh sửa..."
              }
              placeholderTextColor="#94a3b8"
              className="text-slate-800 text-sm py-1 max-h-24 leading-5"
              editable={!isRecording && !isProcessing}
            />
          </View>
        </View>

        {/* 2. KHUNG CHAT Ở GIỮA */}
        <View className="flex-1 bg-white">
          <FlatList
            ref={flatListRef}
            data={conversation}
            keyExtractor={(item, idx) => item.id || idx.toString()}
            renderItem={renderChatItem}
            contentContainerStyle={{ paddingVertical: 10, flexGrow: 1 }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-10 px-4">
                <Text className="text-slate-400 text-sm text-center">
                  Chưa có nội dung hội thoại. Nhấn nút Mic bên dưới để bắt đầu nói.
                </Text>
              </View>
            }
          />
        </View>

        {/* 3. NÚT GHI ÂM VÀ GỬI NGANG HÀNG - CÁCH ĐÁY 40 */}
        <View
          style={{ marginBottom: 40 }}
          className="px-6 pt-3 bg-white border-t border-slate-100"
        >
          <View className="flex-row items-center justify-between">
            <View className="w-12 h-12" />

            <View className="items-center">
              <TouchableOpacity
                onPress={handleToggleRec}
                disabled={isProcessing}
                activeOpacity={0.8}
                className={`w-14 h-14 rounded-full items-center justify-center shadow-md ${
                  isRecording
                    ? "bg-red-500"
                    : currentPhase === "TEMPLATE_DRAFTING"
                    ? "bg-amber-500"
                    : "bg-teal-600"
                }`}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : isRecording ? (
                  <StopCircle size={26} color="#ffffff" />
                ) : (
                  <Mic size={26} color="#ffffff" />
                )}
              </TouchableOpacity>
              <Text className="text-slate-400 text-[10px] mt-1 font-medium">
                {isRecording ? "Dừng ghi" : "Bấm để nói"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleProcessAI}
              disabled={isProcessing || isRecording || !inputText.trim()}
              activeOpacity={0.8}
              className={`w-12 h-12 rounded-full items-center justify-center shadow-sm ${
                inputText.trim() && !isProcessing && !isRecording
                  ? currentPhase === "TEMPLATE_DRAFTING"
                    ? "bg-amber-500"
                    : "bg-teal-600"
                  : "bg-slate-200"
              }`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send
                  size={18}
                  color={
                    inputText.trim() && !isProcessing && !isRecording
                      ? "#ffffff"
                      : "#94a3b8"
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Base>
  );
};

export default VoiceAIScreen;