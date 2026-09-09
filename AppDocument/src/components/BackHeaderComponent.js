import React from "react";
import { TouchableOpacity, View, Text, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BackHeader = ({ title, link, onDownload }) => {
  const navigation = useNavigation();

const handleDownload = async () => {
    if (!link) return;
    let directUrl = link;
    if (directUrl.includes("docs.google.com/gview")) {
      const match = directUrl.match(/[?&]url=([^&]+)/);
      if (match && match[1]) {
        directUrl = decodeURIComponent(match[1]);
      }
    }    if (
      directUrl.includes("cloudinary.com") &&
      directUrl.includes("/upload/") &&
      !directUrl.includes("fl_attachment")
    ) {
      directUrl = directUrl.replace("/upload/", "/upload/fl_attachment/");
    }
    try {
      await Linking.openURL(directUrl);
    } catch (error) {
      console.error("Lỗi khi mở liên kết tải file:", error);
      Alert.alert("Lỗi", "Không thể mở trình duyệt để tải file.");
    }
  };

  return (
    <View className="bg-indigo-700 px-4 pt-4 pb-4 shadow-md">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-9 h-9 rounded-xl bg-indigo-900/40 items-center justify-center mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {title && (
            <Text 
              className="text-white font-bold text-lg flex-1" 
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
        </View>

        {link && (
          <TouchableOpacity
            onPress={handleDownload}
            className="w-9 h-9 rounded-xl bg-indigo-900/40 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default BackHeader;