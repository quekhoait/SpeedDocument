import React, { useState, useContext, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, Image, Alert } from "react-native";
import { PenTool, Image as ImageIcon } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Base from "../layout/Base";

import { authService } from "../services/authServices";
import { AuthContext } from "../context/AuthContext";
import SignatureModal from "../components/SignatureModel";
import SignatureItem from "../components/SignatureItem";

const SignatureScreen = () => {
  const { currentUser, setCurrentUser, refreshUser } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState([]);

  const userSignature = useMemo(() => {
    const raw = currentUser?.signature;
    if (!raw) return null;

    try {
      return typeof raw === "string" && raw.startsWith("{") ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }, [currentUser?.signature]);

  const handleSavePersonalSignature = async (base64) => {
    const token = await AsyncStorage.getItem("access_token");
    const res = await authService.saveSignature(token, base64);

    const newSignature =  res?.data?.signature;

    if (newSignature) {
      setCurrentUser?.((prev) => ({ ...prev, signature: newSignature }));
      setSavedSignatures((prev) => [{ id: Date.now().toString(), imageUri: base64 }, ...prev]);
      if (refreshUser) refreshUser();
      Alert.alert("Thành công", "Đã lưu chữ ký vào tài khoản!");
    } else {
      throw new Error(res?.data?.message || "Không tìm thấy dữ liệu chữ ký trả về!");
    }
  };

  return (
    <Base hasHeader={false} activeTab={1} headerTitle="TẠO CHỮ KÝ">
      <View className="flex-1 px-6 py-4">
        <FlatList
          data={savedSignatures}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SignatureItem
              item={item}
              onDelete={() => setSavedSignatures((prev) => prev.filter((x) => x.id !== item.id))}
            />
          )}
          ListHeaderComponent={
            <View>
              <Text className="text-2xl font-bold text-slate-900 text-center mt-2 mb-4">
                Quản lý chữ ký điện tử
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setModalVisible(true)}
                className="flex-row items-center justify-center bg-teal-600 py-3.5 rounded-2xl mb-5 shadow-sm"
              >
                <PenTool size={18} color="#fff" />
                <Text className="text-white text-sm font-bold ml-2">Mở khung tạo chữ ký</Text>
              </TouchableOpacity>

              {userSignature?.url && (
                <View className="bg-white p-4 rounded-3xl border border-teal-100 shadow-sm mb-4">
                  <View className="flex-row items-center mb-2">
                    <ImageIcon size={18} color="#0d9488" />
                    <Text className="text-slate-800 text-sm font-bold ml-2">Chữ ký hiện tại</Text>
                  </View>
                  <View className="h-28 bg-slate-50 rounded-2xl items-center justify-center border border-dashed border-slate-200">
                    <Image
                      source={{ uri: userSignature.url }}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  </View>
                </View>
              )}
            </View>
          }
        />

        <SignatureModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onConfirm={handleSavePersonalSignature}
          title="Tạo chữ ký cá nhân"
        />
      </View>
    </Base>
  );
};

export default SignatureScreen;