import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  FileText,
  Mic,
  PenTool,
  ArrowRight,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import Base from "../layout/Base";
import ButtonComponent from "../components/ButtonComponent";
import SignatureModal from "../components/SignatureModel";
import { authService } from "../services/authServices";
import { AuthContext } from "../context/AuthContext";
import { documentServices } from "../services/documentServices";

const CreateDocumentScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useContext(AuthContext);
      const token =  AsyncStorage.getItem("access_token");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const response = await authService.getDocuments(token);

      const docsList = response?.data?.data || response?.data || response || [];
      setDocuments(Array.isArray(docsList) ? docsList : []);
    } catch (error) {
      console.error("Lỗi khi tải văn bản:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const loadSignature = async(documentId) => {
    try{
      console.log("===================", documentId)
        const response = await documentServices.signature(token, documentId);
        const resData = response?.data.data;
        console.log(data)
        if(resData?.status === "OK"){
          Alert.alert("Thành công", "Đã điền chữ ký vào tài liệu!");
        }else{
           Alert.alert("Thất bại", "Điền thất bại!");
        }
    }catch(err){

    } 
  }

  const handleMyDocument = async(item) => {
    const previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(item?.file_path)}&embedded=true`;
    if (!item?.file_path) {
      Alert.alert("Thông báo", "Văn bản này chưa có đường dẫn xem trước.");
      return;
    }

    await loadSignature(item?.id)

    navigation.navigate("preview", {
      previewUrl: previewUrl,
      title: "Xem trước tài liệu",
    });
  };

  const handleOpenSignature = (item) => {
  const savedSig = currentUser?.signature;

  if (savedSig) {
    Alert.alert(
      "Chọn hình thức ký",
      `Bạn muốn ký tài liệu "${item.name || item.title || 'này'}" bằng hình thức nào?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Vẽ chữ ký mới",
          onPress: () => {
            setSelectedDoc(item);
            setModalVisible(true);
          },
        },
        {
          text: "Dùng chữ ký có sẵn",
          onPress: () => {
            handleSaveSignatureAvailble(savedSig, item);
          },
        },
      ]
    );
  } else {
    setSelectedDoc(item);
    setModalVisible(true);
  }
};

  const handleCloseSignature = () => {
    if (!isSaving) {
      setModalVisible(false);
      setSelectedDoc(null);
    }
  };

  // #Dùng chữ ký có sẵn thì ko gửi signature
  const handleSaveSignatureAvailble = async () => {
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      
      const response = await documentServices.updateSignatureUser(
        token,
        selectedDoc?.id,
      );

      const resData = response?.data;
      console.log("================", resData)
      if (resData && (resData.status === "OK" || response?.status === 200)) {
        Alert.alert("Thành công", "Đã ký tài liệu thành công!");
        handleCloseSignature();
        fetchDocuments(); 
      } else {
        Alert.alert("Lỗi", resData?.message || "Không thể ký tài liệu!");
      }
    } catch (error) {
      console.error("Lỗi khi ký tài liệu:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi kết nối với máy chủ khi gửi chữ ký.");
    } finally {
      setIsSaving(false);
    }
  };


 

  return (
    <Base headerTitle="AI Document" activeTab={1} hasHeader={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        }}
      >
        {/* Lời chào */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text>
              <Text className="text-gray-500 text-xl">Chào, </Text>
              <Text className="text-2xl font-bold text-gray-900">
                {currentUser?.fullname || currentUser?.name || "Người dùng"}
              </Text>
            </Text>
          </View>
        </View>

        {/* Action nhanh: Soạn thảo & Ra lệnh */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={() => navigation.navigate("draft")}
            className="flex-1 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm"
          >
            <View className="w-10 h-10 bg-slate-200/60 rounded-xl items-center justify-center mb-3">
              <FileText size={20} color="#475569" />
            </View>
            <Text className="text-xs font-semibold tracking-wider text-teal-600 uppercase mb-1">
              Soạn thảo
            </Text>
            <Text className="text-lg font-bold text-gray-900">
              Draft with AI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("voice")}
            className="flex-1 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm"
          >
            <View className="w-10 h-10 bg-teal-100/60 rounded-xl items-center justify-center mb-3">
              <Mic size={20} color="#0d9488" />
            </View>
            <Text className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">
              Ra lệnh
            </Text>
            <Text className="text-lg font-bold text-gray-900">
              Voice Request
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mục ký tên mẫu */}
        <TouchableOpacity
          onPress={() => navigation.navigate("signature")}
          className="flex-row items-center justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm mb-8"
        >
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-indigo-100 rounded-2xl items-center justify-center mr-4">
              <PenTool size={22} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">Sign Docs</Text>
              <Text className="text-sm text-gray-500 mt-0.5">
                Ký điện tử an toàn
              </Text>
            </View>
          </View>
          <View className="w-10 h-10 bg-slate-200/50 rounded-full items-center justify-center">
            <ArrowRight size={20} color="#334155" />
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            Tài liệu của bạn
          </Text>
        </View>

        {loading ? (
          <View className="py-8 items-center justify-center">
            <ActivityIndicator size="small" color="#0d9488" />
            <Text className="text-xs text-gray-400 mt-2">
              Đang tải danh sách tài liệu...
            </Text>
          </View>
        ) : documents.length > 0 ? (
          <View className="space-y-3">
            {documents.map((item) => (
              <TouchableOpacity
                key={item.id?.toString()}
                onPress={() => handleMyDocument(item)}
                activeOpacity={0.7}
                className="flex-row items-center my-2 justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm"
              >
                <View className="flex-1 pr-3">
                  <Text
                    className="text-base font-bold text-gray-900"
                    numberOfLines={1}
                  >
                    {item.name || item.title || `Văn bản #${item.id}`}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Ngày tạo:{" "}
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                      : "Vừa xong"}
                  </Text>
                </View>

                {!item.signature && (
                  <View>
                    <ButtonComponent
                      title="Ký tên"
                      className="px-3 py-1.5 rounded-full text-xs"
                      onPress={() => handleOpenSignature(item)}
                    />
                  </View>
                )}
                
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="py-10 items-center justify-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <Text className="text-sm font-semibold text-gray-500">
              Chưa có tài liệu nào
            </Text>
            <Text className="text-xs text-gray-400 mt-1">
              Hãy bấm vào "Draft with AI" để tạo tài liệu mới
            </Text>
          </View>
        )}
      </ScrollView>

      <SignatureModal
        visible={modalVisible}
        onClose={handleCloseSignature}
        onSave={handleSaveSignatureAvailble}
        isSaving={isSaving}
      />
    </Base>
  );
};

export default CreateDocumentScreen;