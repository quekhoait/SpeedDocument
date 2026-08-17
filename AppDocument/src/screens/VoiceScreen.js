import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { Mic, Sparkles, StopCircle } from "lucide-react-native";
import Base from "../layout/Base";
import { documentServices } from "../services/documentServices";
import { saveChatMessage } from "../services/FireBaseServices";



const VoiceAIScreen = () => {
  const navigation = useNavigation();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);


  const [inputText, setInputText] = useState("");
  const [documentId, setDocumentId] = useState(null);
  const [userInputs, setUserInputs] = useState([]);
  const [missingFields, setMissingFields] = useState([]);
  const [isComplete, setIsComplete] = useState(false);


  useEffect(() => {
    const setupAudio = async () => {
      try {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Thông báo", "Ứng dụng cần quyền Microphone để ghi âm.");
          return;
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      } catch (error) {
        console.error("Lỗi microphone:", error);

        Alert.alert("Lỗi", "Không thể khởi tạo microphone.");
      }
    };

    setupAudio();
  }, []);

  const getToken = async () => {
    return await AsyncStorage.getItem("access_token");
  };

  const startRecording = async () => {
    try {
      if (isProcessing) {
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Thông báo", "Bạn chưa cấp quyền microphone.");
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (error) {
      console.error("Lỗi bắt đầu ghi âm:", error);
      setIsRecording(false);
      Alert.alert("Lỗi", "Không thể bắt đầu ghi âm.");
    }
  };


  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) {
        throw new Error("Không lấy được file ghi âm.");
      }
      const response = await documentServices.speedToText(uri)
      const resData = response?.data;
      if (resData?.status !== "OK") {
        Alert.alert(
          "Lỗi",
          resData?.message || "Không thể nhận diện giọng nói.",
        );

        return;
      }
      const resultText = resData?.data?.text ;

      if (!resultText.trim()) {
        Alert.alert("Thông báo", "Không nhận diện được nội dung giọng nói.");
        return;
      }
      setInputText(resultText);
    } catch (error) {
      console.error("Lỗi speech-to-text:", error);

      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Có lỗi xảy ra khi xử lý giọng nói.",
      );
    } finally {
      setIsProcessing(false);
    }
  };


  const handleToggleRecording = async () => {
    if (isProcessing) {
      return;
    }
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };


  const handleProcessAI = async () => {
    let promptToSend = inputText.trim();
    if (!promptToSend && userInputs.length === 0) {
      Alert.alert(
        "Thông báo",
        "Vui lòng nhập hoặc nói nội dung trước khi gửi.",
      );

      return;
    }

    setIsProcessing(true);

    try {
      if (promptToSend) {
        setUserInputs((prev) => [...prev, promptToSend]);

        setInputText("");
      } else {
        promptToSend = userInputs[userInputs.length - 1] || "";
      }
      if (documentId) {
        saveChatMessage(documentId, "user_answer", promptToSend).catch(
          console.error,
        );
      }
      const token = await getToken();
      const response = await documentServices.createDocument(token, {
        documentId: documentId,
        prompt: promptToSend,
      });


      const resData = response?.data;
      if (
        resData &&
        (resData.status === "OK" || resData.documentId || resData.id)
      ) {

        const currentDocId = resData.documentId || resData.id || documentId;

        setDocumentId(currentDocId);
        setIsComplete(resData.isComplete);
        if (!documentId && currentDocId) {
          saveChatMessage(currentDocId, "user_answer", promptToSend).catch(
            console.error,
          );
        }
        if (resData.message) {
          saveChatMessage(currentDocId, "ai_question", resData.message).catch(
            console.error,
          );
        }
        if (resData.isComplete) {
          Alert.alert(
            "Thành công",
            "Đã thu thập đủ thông tin để tạo văn bản!",
            [
              {
                text: "Xem trước",

                onPress: () => {
                  navigation.navigate("PreviewScreen", {
                    documentId: currentDocId,
                  });
                },
              },
            ],
          );
        }

        else {
          setMissingFields(resData.missingFields || []);
          if (resData.message) {
            Alert.alert("AI cần thêm thông tin", resData.message);
          }
        }
      } else {
        Alert.alert("Lỗi", resData?.message || "Không thể xử lý yêu cầu.");
      }
    } catch (error) {
      console.error("Lỗi Process AI:", error);

      const errMsg =
        error?.response?.data?.message ||
        "Đã có lỗi xảy ra trong quá trình xử lý với AI.";

      Alert.alert("Lỗi", errMsg);
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <Base hasHeader={false} activeTab={1} headerTitle="GIỌNG NÓI AI">
      <View className="flex-1 px-6 py-4 justify-between">
       <View>
          <Text className="text-gray-900 text-2xl font-bold text-center mb-6 mt-2">
            {isProcessing
              ? "Đang xử lý..."
              : isRecording
                ? "Đang lắng nghe..."
                : "Nội dung nhận diện"}
          </Text>

             <View className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm min-h-[180px]">
            {isProcessing ? (
              <View className="flex-1 items-center justify-center py-8">
                <ActivityIndicator size="large" color="#0d9488" />

                <Text className="text-slate-500 mt-2 text-sm">
                  Đang xử lý...
                </Text>
              </View>
            ) : (
              <TextInput
                multiline
                value={inputText}
                onChangeText={setInputText}
                placeholder="Nói hoặc nhập nội dung tại đây..."
                placeholderTextColor="#94a3b8"
                className="text-slate-700 text-base leading-7 font-medium flex-1"
                textAlignVertical="top"
                editable={!isRecording}
              />
            )}
          </View>

          {missingFields.length > 0 && (
            <View className="mt-3">
              <Text className="text-slate-500 text-sm">
                Thông tin còn thiếu:
              </Text>

              <Text className="text-teal-600 font-semibold mt-1">
                {missingFields.join(", ")}
              </Text>
            </View>
          )}
        </View>

      

        <View className="items-center justify-center my-6">
          <TouchableOpacity
            onPress={handleToggleRecording}
            disabled={isProcessing}
            activeOpacity={0.8}
            className={`w-32 h-32 rounded-full items-center justify-center ${
              isRecording
                ? "bg-red-50 border border-red-200"
                : "bg-teal-50 border border-teal-200"
            }`}
          >
            <View
              className={`w-24 h-24 rounded-full items-center justify-center shadow-sm ${
                isRecording
                  ? "bg-red-100 border border-red-300"
                  : "bg-teal-100/60 border border-teal-300"
              }`}
            >
              {isRecording ? (
                <StopCircle size={38} color="#ef4444" />
              ) : (
                <Mic size={38} color="#0d9488" />
              )}
            </View>
          </TouchableOpacity>

          <Text className="text-slate-500 mt-3 text-sm">
            {isRecording ? "Nhấn để dừng ghi âm" : "Nhấn để bắt đầu ghi âm"}
          </Text>
        </View>
        <View className="mb-4">

          <TouchableOpacity
            onPress={handleProcessAI}
            disabled={isProcessing || !inputText.trim() || isRecording}
            activeOpacity={0.8}
            className={`flex-row items-center justify-center py-4 px-6 rounded-2xl shadow-sm ${
              inputText.trim() && !isProcessing && !isRecording
                ? "bg-teal-600"
                : "bg-slate-300"
            }`}
          >
            <Sparkles size={20} color="#ffffff" />

            <Text className="text-white font-bold text-base ml-2">
              Tạo văn bản
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleRecording}
            disabled={isProcessing}
            activeOpacity={0.7}
            className="flex-row items-center justify-center py-4 px-6 rounded-2xl bg-slate-100 border border-slate-200 mt-3"
          >
            {isRecording ? (
              <>
                <StopCircle size={20} color="#ef4444" />

                <Text className="text-red-500 font-semibold text-base ml-2">
                  Dừng & Nhận Diện
                </Text>
              </>
            ) : (
              <>
                <Mic size={20} color="#0d9488" />

                <Text className="text-slate-700 font-semibold text-base ml-2">
                  Bắt Đầu Ghi Âm
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
