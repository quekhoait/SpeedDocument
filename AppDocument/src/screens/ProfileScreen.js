import React, { useContext, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Base from "../layout/Base";
import { AuthContext } from "../context/AuthContext";
import { authService } from "../services/authServices";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileScreen = () => {
  const { currentUser, setCurrentUser, logout } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState(currentUser?.avatar || null);

  const [formData, setFormData] = useState({
    fullname: currentUser?.fullname || "",
    phone: currentUser?.phone || "",
    gender: currentUser?.gender || "Khác",
    address: currentUser?.address || "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChooseAvatar = () => {
    if (!isEditing) return;
    Alert.alert("Thay đổi ảnh đại diện", "Chọn nguồn ảnh", [
      {
        text: "Chọn từ thư viện",
        onPress: async () => {
          try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
              Alert.alert("Thông báo", "Bạn cần cấp quyền truy cập thư viện ảnh để thực hiện chức năng này!");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'], 
              allowsEditing: true, 
              aspect: [1, 1],       
              quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
              setAvatarUri(result.assets[0].uri);
            }
          } catch (error) {
            console.error("Lỗi chọn ảnh:", error);
            Alert.alert("Lỗi", "Không thể mở thư viện ảnh!");
          }
        },
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setCurrentUser(null);
        return;
      }
      const dataToSend = new FormData();
      dataToSend.append("fullname", formData.fullname || "");
      dataToSend.append("phone", formData.phone || "");
      dataToSend.append("gender", formData.gender || "Khác");
      dataToSend.append("address", formData.address || "");
     if (avatarUri) {
      const isNewImageSelected = avatarUri.startsWith("file://")
      if (isNewImageSelected) {
      dataToSend.append("avatar", {
        uri: avatarUri,
        name: "avatar.jpg",
        type: "image/jpeg",
     });
  } else {
    dataToSend.append("avatar", avatarUri);
  }
}

      const response = await authService.updateUser(token, dataToSend);

      const updatedUserData = response?.data?.data || response?.data?.user || response?.data;

      if (updatedUserData) {
        setCurrentUser(updatedUserData);
      }

      setIsEditing(false); 
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");

    } catch (err) {
      console.error("Lỗi cập nhật profile:", err);
      Alert.alert("Lỗi", err?.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullname: currentUser.fullname || "",
        phone: currentUser.phone || "",
        gender: currentUser.gender || "Khác",
        address: currentUser.address || "",
      });
      setAvatarUri(currentUser.avatar || null);
    }
  }, [currentUser]); 

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => logout && logout() },
    ]);
  };

  return (
    <Base hasHeader={false} headerTitle="Profile" activeTab={2}>
      <ScrollView className="flex-1 bg-gray-50 px-4 py-6" showsVerticalScrollIndicator={false}>
        
        {/* Header Avatar & Tên */}
        <View className="items-center mb-6">
          <TouchableOpacity
            onPress={handleChooseAvatar}
            className="w-28 h-28 relative rounded-full shadow-lg border-2 border-white mb-3 overflow-hidden"
            activeOpacity={isEditing ? 0.8 : 1}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-full h-full rounded-full" />
            ) : (
              <View className="w-full h-full rounded-full bg-blue-600 justify-center items-center">
                <Text className="text-white text-4xl font-bold">
                  {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}

            {isEditing && (
              <View className="absolute inset-0 bg-black/50 justify-center items-center">
                <Text className="text-white text-xs font-semibold">Sửa ảnh</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text className="text-xl font-bold text-gray-800">
            {currentUser?.fullname || currentUser?.username || "Người dùng"}
          </Text>
          <Text className="text-sm text-gray-500">@{currentUser?.username || "username"}</Text>
        </View>

        {/* Thông tin tài khoản (Chỉ đọc) */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tài khoản</Text>
          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">Email</Text>
            <Text className="text-base font-medium text-gray-800">{currentUser?.email || "Chưa cập nhật"}</Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500 mb-1">Tên đăng nhập</Text>
            <Text className="text-base font-medium text-gray-800">{currentUser?.username || "Chưa cập nhật"}</Text>
          </View>
        </View>

        {/* Thông tin cá nhân (Cho phép sửa) */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin cá nhân</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text className="text-blue-600 font-semibold text-sm">
                {isEditing ? "Hủy" : "Chỉnh sửa"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Họ và tên */}
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Họ và tên</Text>
            {isEditing ? (
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 shadow-inner"
                value={formData.fullname}
                onChangeText={(val) => handleChange("fullname", val)}
                placeholder="Nhập họ và tên"
              />
            ) : (
              <Text className="text-base text-gray-800">{formData.fullname || "Chưa cập nhật"}</Text>
            )}
          </View>

          {/* Số điện thoại */}
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Số điện thoại</Text>
            {isEditing ? (
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 shadow-inner"
                value={formData.phone}
                onChangeText={(val) => handleChange("phone", val)}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            ) : (
              <Text className="text-base text-gray-800">{formData.phone || "Chưa cập nhật"}</Text>
            )}
          </View>

          {/* Giới tính */}
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1">Giới tính</Text>
            {isEditing ? (
              <View className="flex-row space-x-2">
                {["Nam", "Nữ", "Khác"].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    onPress={() => handleChange("gender", gender)}
                    className={`px-4 py-2 rounded-lg border ${
                      formData.gender === gender ? "bg-blue-600 border-blue-600" : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <Text className={formData.gender === gender ? "text-white font-medium" : "text-gray-700"}>
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text className="text-base text-gray-800">{formData.gender || "Chưa cập nhật"}</Text>
            )}
          </View>


          {/* Địa chỉ */}
          <View className="mb-2">
            <Text className="text-xs text-gray-500 mb-1">Địa chỉ</Text>
            {isEditing ? (
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 shadow-inner"
                value={formData.address}
                onChangeText={(val) => handleChange("address", val)}
                placeholder="Nhập địa chỉ"
                multiline
                numberOfLines={2}
              />
            ) : (
              <Text className="text-base text-gray-800">{formData.address || "Chưa cập nhật"}</Text>
            )}
          </View>

          {/* Nút lưu */}
          {isEditing && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className={`mt-4 py-3 rounded-xl items-center shadow-sm ${
                loading ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"
              }`}
            >
              <Text className="text-white font-bold text-base">
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nút đăng xuất */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 border border-red-200 py-3 rounded-2xl items-center mb-10 active:bg-red-100"
        >
          <Text className="text-red-600 font-bold text-base">Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </Base>
  );
};

export default ProfileScreen;