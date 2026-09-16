import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Base from "../layout/Base";
import { documentServices } from "../services/documentServices";
import {
  saveChatMessage,
  subscribeChatMessages,
  migrateSessionMessages,
} from "../services/FireBaseServices";
import { templateService } from "../services/templateServices";

const generateNewSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const DraftScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedTemplate, setSelectedTemplate] = useState(
    route.params?.template
  );
  const [documentId, setDocumentId] = useState(route.params?.documentId);
  const [sessionId, setSessionId] = useState(
    route.params?.documentId
      ? String(route.params.documentId)
      : generateNewSessionId()
  );

  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [document, setDocument] = useState(null);

  const [currentPhase, setCurrentPhase] = useState("FILLING_DATA"); // 'TEMPLATE_DRAFTING' | 'FILLING_DATA'
  const [dynamicTemplateData, setDynamicTemplateData] = useState(null);
  const [dynamicFileUrl, setDynamicFileUrl] = useState(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const getToken = async () => await AsyncStorage.getItem("access_token");

  // Xử lý bàn phím
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const fetchDocumentState = async (docId) => {
    try {
      const token = await getToken();
      const res = await documentServices.getDocumentById(token, docId);
      const docData = res?.data?.data || res?.data?.document || res?.data;

      if (docData) {
        setDocument(docData);
        setMissingFields(docData.missing_fields || []);
        setIsComplete(Boolean(docData.status));

        const draftInfo = docData.extracted_data?._templateDraft;
        if (docData.template_id === null && draftInfo) {
          setCurrentPhase("TEMPLATE_DRAFTING");
          setDynamicTemplateData(draftInfo);
          setDynamicFileUrl(docData.file_path);
        } else {
          setCurrentPhase("FILLING_DATA");
          setDynamicTemplateData(null);
        }
      }
    } catch (error) {
      console.error("Lỗi fetchDocumentState:", error);
    }
  };



  useFocusEffect(
    useCallback(() => {
      const paramDocId = route.params?.documentId ? String(route.params.documentId) : null;
      const paramTemplate = route.params?.template;
      setDocumentId(paramDocId);
      setSelectedTemplate(paramTemplate);

      if (paramDocId) {
        setSessionId(paramDocId);
        fetchDocumentState(paramDocId);
      } else {
        const newSession = generateNewSessionId();
        setSessionId(newSession);
        setInputText("");
        setMissingFields([]);
        setIsComplete(false);
        setDocument(null);
        setDynamicTemplateData(null);
        setDynamicFileUrl(null);
        setCurrentPhase("FILLING_DATA");
        setConversation([]);
      }
    }, [route.params?.documentId, route.params?.template])
  );

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

  const handleConfirmAndSaveTemplate = async () => {
    if (!dynamicTemplateData || savingTemplate) return;
    setSavingTemplate(true);

    try {
      const token = await getToken();


      const payload = {
        documentId: documentId,
        categoryId: 1,
        name: dynamicTemplateData.name,
        description: dynamicTemplateData.description,
        fields: dynamicTemplateData.fields,
        urlCloud: dynamicFileUrl,
      };

      const response = await templateService.createTemplate(token, payload);

      if (response?.data?.status === "OK" || response?.status === 201 || response?.status === 200) {
        setCurrentPhase("FILLING_DATA");

        await saveChatMessage(
          sessionId,
          "system_info",
          `Mẫu "${dynamicTemplateData.name || dynamicTemplateData.title}" đã được lưu vào hệ thống thành công!`,
          []
        );

        const fieldsToAsk = (dynamicTemplateData.fields || []).map((f) => ({
          field_key: f.field_key,
          field_label: f.field_label,
          question: f.question,
        }));
        setMissingFields(fieldsToAsk);

        await saveChatMessage(
          sessionId,
          "ai_question",
          `Bây giờ chúng ta sẽ bắt đầu điền thông tin vào văn bản.\n\nVui lòng cung cấp các thông tin sau:\n` +
            fieldsToAsk.map((f) => `- ${f.question || f.field_label}`).join("\n"),
          fieldsToAsk
        );
      } else {
        Alert.alert("Thông báo", response?.data?.message || "Không thể lưu template.");
      }
    } catch (error) {
      console.error("Lỗi lưu template:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Lỗi khi lưu template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleProcessAI = async (textToSend = null) => {
    const promptToSend = (textToSend || inputText).trim();
    if (!promptToSend || loading) return;
    setLoading(true);
    setInputText("");
    const currentSession = sessionId;

    try {
      await saveChatMessage(currentSession, "user_answer", promptToSend, []);
      const token = await getToken();
      const response = await documentServices.createDocument(token, {
        documentId: documentId,
        prompt: promptToSend,
        templateId: selectedTemplate?.id,
      });

      const resData = response?.data;
      const currentDocId = resData?.documentId ? String(resData.documentId) : documentId;

      if (!documentId && currentDocId) {
        await migrateSessionMessages(currentSession, currentDocId);
        setDocumentId(currentDocId);
        setSessionId(currentDocId);
      }

      const activeSession = currentDocId || currentSession;
      const phaseFromApi = resData?.phase || "FILLING_DATA";
      setCurrentPhase(phaseFromApi);

      if (phaseFromApi === "TEMPLATE_DRAFTING") {
        setDynamicTemplateData(resData.templateData);
        setDynamicFileUrl(resData.fileUrl);
      } else {
        const currentMissing = resData?.missingFields || [];
        setMissingFields(currentMissing);

        const completed = Boolean(resData?.isComplete && (resData?.status === "OK" || resData?.status === 200));
        setIsComplete(completed);
        if (completed) setDocument(resData?.document || resData);
      }

      await saveChatMessage(
        activeSession,
        "ai_question",
        resData?.message || "Đã nhận được thông tin và đang xử lý.",
        resData?.missingFields || []
      );
    } catch (error) {
      const errMsg = error.response?.data?.message || "Đã có lỗi xảy ra trong quá trình xử lý với AI.";
      await saveChatMessage(currentSession, "ai_question", errMsg, []);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillMissing = (item) => {
    inputRef.current?.focus();
    const fields = item?.missingFields?.length > 0 ? item.missingFields : missingFields;
    if (fields && fields.length > 0) {
      const templateText = fields.map((f) => `${f.label}: `).join("\n");
      setInputText(templateText);
    }
  };

  const renderChatItem = ({ item, index }) => {
    const rawContent = item.content || item.message || "";
    const isUser = item.sender === "user_answer" || item.type === "user_answer";
    const isSystem = item.sender === "system_info" || item.type === "system_info";
    const isLastMessage = index === conversation.length - 1;

    if (isSystem) {
      return (
        <View style={{ alignItems: "center", marginVertical: 10, paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 }}>
            <Text style={{ fontSize: 12, color: "#475569", fontWeight: "500", textAlign: "center" }}>
              {rawContent}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          justifyContent: isUser ? "flex-end" : "flex-start",
          marginVertical: 4,
          paddingHorizontal: 12,
        }}
      >
        {!isUser && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: currentPhase === "TEMPLATE_DRAFTING" ? "#F59E0B" : "#2563EB",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              marginTop: 4,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 12 }}>
              {currentPhase === "TEMPLATE_DRAFTING" ? "⚙️" : "AI"}
            </Text>
          </View>
        )}

        <View style={{ maxWidth: "80%", alignItems: isUser ? "flex-end" : "flex-start" }}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 18,
              borderTopRightRadius: isUser ? 2 : 18,
              borderTopLeftRadius: !isUser ? 2 : 18,
              backgroundColor: isUser ? "#0084FF" : "#F0F2F5",
            }}
          >
            <Text style={{ fontSize: 15, lineHeight: 22, color: isUser ? "#FFFFFF" : "#1E293B" }}>
              {rawContent}
            </Text>
          </View>

          {!isUser && isLastMessage && currentPhase === "TEMPLATE_DRAFTING" && dynamicTemplateData && (
            <View
              style={{
                marginTop: 8,
                backgroundColor: "#FFFBEB",
                borderColor: "#FDE68A",
                borderWidth: 1,
                borderRadius: 12,
                padding: 10,
                width: "100%",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#B45309", marginBottom: 8 }}>
                Bản nháp mẫu: {dynamicTemplateData.name || dynamicTemplateData.title}
              </Text>
              <Text style={{ fontSize: 12, color: "#78350F", marginBottom: 10 }}>
                Hãy chat các yêu cầu chỉnh sửa nếu chưa ưng ý. Khi mẫu đã đạt, bấm nút xác nhận bên dưới.
              </Text>

              <View style={{ flexDirection: "row", gap: 8 }}>
                {dynamicFileUrl && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate("preview", { previewUrl: dynamicFileUrl, documentId })}
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderColor: "#D97706",
                      borderWidth: 1,
                      paddingVertical: 7,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#D97706", fontWeight: "600", fontSize: 12 }}>👁 Xem mẫu Word</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleConfirmAndSaveTemplate}
                  disabled={savingTemplate}
                  style={{
                    flex: 1.3,
                    backgroundColor: "#F59E0B",
                    paddingVertical: 7,
                    borderRadius: 8,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  {savingTemplate ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 12 }}>
                      Xác nhận & Lưu mẫu
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* NÚT THÊM THÔNG TIN (GIAI ĐOẠN FILLING_DATA) */}
          {!isUser &&
            currentPhase === "FILLING_DATA" &&
            missingFields.length > 0 &&
            !isComplete &&
            isLastMessage && (
              <TouchableOpacity
                onPress={() => handleQuickFillMissing(item)}
                style={{
                  marginTop: 6,
                  backgroundColor: "#EFF6FF",
                  borderColor: "#93C5FD",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#2563EB", fontWeight: "bold", fontSize: 13, marginRight: 4 }}>＋</Text>
                <Text style={{ color: "#2563EB", fontWeight: "600", fontSize: 13 }}>Thêm thông tin còn thiếu</Text>
              </TouchableOpacity>
            )}

          {/* NÚT XEM TRƯỚC VĂN BẢN HOÀN TẤT */}
          {isComplete && isLastMessage && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("preview", {
                  documentId,
                  document,
                  previewUrl: document?.file_path || document?.fileUrl,
                })
              }
              style={{
                marginTop: 8,
                backgroundColor: "#10B981",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>Xem trước văn bản ngay</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <Base hasHeader={false} activeTab={1} headerTitle="SOẠN THẢO AI" hasNav={false}>
      <View style={{ flex: 1, width: "100%", height: "100%", backgroundColor: "#FFFFFF", paddingBottom: keyboardHeight }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#F1F5F9",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: currentPhase === "TEMPLATE_DRAFTING" ? "#F59E0B" : "#2563EB",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 14 }}>
                {currentPhase === "TEMPLATE_DRAFTING" ? "⚙️" : "AI"}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#0F172A" }}>Trợ lý Soạn thảo</Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: currentPhase === "TEMPLATE_DRAFTING" ? "#D97706" : "#10B981",
                }}
              >
                {currentPhase === "TEMPLATE_DRAFTING" ? "● Chỉnh sửa mẫu văn bản" : "● Điền thông tin văn bản"}
              </Text>
            </View>
          </View>
        </View>

        {/* Khung Chat */}
        <View style={{ flex: 1, overflow: "hidden" }}>
        {selectedTemplate && (
          <View>
            <Text>Đang dùng template {selectedTemplate?.name}</Text>
          </View>
        )}
          <FlatList
            ref={flatListRef}
            style={{ flex: 1 }}
            data={conversation}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={renderChatItem}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
          />
        </View>

        {loading && (
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 6 }}>
            <ActivityIndicator size="small" color="#0084FF" />
            <Text style={{ color: "#94A3B8", fontSize: 12, marginLeft: 8 }}>AI đang xử lý thông tin...</Text>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 12,
            paddingTop: 8,
            marginBottom: 50,
            paddingBottom: Platform.OS === "ios" && keyboardHeight === 0 ? 20 : 8,
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
            backgroundColor: "#FFFFFF",
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#F0F2F5",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              maxHeight: 100,
              marginRight: 8,
            }}
          >
            <TextInput
              ref={inputRef}
              multiline
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                currentPhase === "TEMPLATE_DRAFTING"
                  ? "Nhập yêu cầu để sửa mẫu (ví dụ: Thêm mục bàn giao...)"
                  : "Nhập thông tin hoặc trả lời câu hỏi của AI..."
              }
              placeholderTextColor="#94A3B8"
              style={{ fontSize: 15, color: "#1E293B", padding: 0 }}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            onPress={() => handleProcessAI()}
            disabled={loading || !inputText.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: loading || !inputText.trim() ? "#E2E8F0" : "#0084FF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 2,
            }}
          >
            <Text style={{ color: loading || !inputText.trim() ? "#94A3B8" : "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>
              ➤
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Base>
  );
};

export default DraftScreen;