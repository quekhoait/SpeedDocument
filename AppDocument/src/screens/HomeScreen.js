import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Searchbar } from "react-native-paper";
import Base from "../layout/Base";
import TemplateItem from "../components/HomeComponents/TemplateItem";
import { templateService } from "../services/templateServices";

const ALL_CATEGORY = { id: "All", name: "Tất cả" };

const HomeScreen = () => {
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const [categories, setCategories] = useState([ALL_CATEGORY]);
  const [templates, setTemplates] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("All");

  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await templateService.getAllCategory();
      const rawCategories = response?.data?.data || [];
      setCategories([ALL_CATEGORY, ...rawCategories]);
    } catch (error) {
      console.error("Lỗi khi lấy danh mục template:", error);
      Alert.alert("Lỗi", error?.response?.data?.message || "Không thể tải danh mục văn bản");
    }
  };

  const fetchTemplates = async (categoryId, keyword) => {
    try {
      setIsLoading(true);
      const response = await templateService.search(categoryId, keyword);
      const data = response?.data?.data;
      setTemplates(data);
    } catch (error) {
      console.error("Lỗi khi tải mẫu văn bản:", error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTemplates(selectedCategoryId, debouncedSearchQuery);
  }, [selectedCategoryId, debouncedSearchQuery]);

  const handleDetailTemplate = (file_path, title = "Đơn xin nghỉ việc") => {

    if (!file_path) {
      Alert.alert("Thông báo", "Mẫu này chưa có đường dẫn xem trước.");
      return;
    }
  const previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file_path)}&embedded=true`;
    navigation.navigate("preview", {
      previewUrl: previewUrl,
      title: title,
    });
  };

  const handleSelectCategory = (cateId) => {
    setSelectedCategoryId(cateId);
  };

  return (
    <Base headerTitle="AI Document" activeTab={0} hasHeader={true}>
      <View className="flex-1 bg-orange-100 p-4">
        <Text className="text-2xl font-bold text-slate-800">
          Thư viện Mẫu Văn Bản
        </Text>
        <Text className="text-base text-gray-500 mb-4 mt-1">
          Chọn mẫu văn bản phù hợp với nhu cầu của bạn
        </Text>

        <Searchbar
          placeholder="Tìm kiếm mẫu..."
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
          onClearIconPress={() => setSearchQuery("")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            elevation: 0,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        />

        <View className="h-12 my-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: "center" }}
          >
            {categories.map((category) => {
              const categoryKey = category.id || category._id;
              const isActive = selectedCategoryId === categoryKey;

              return (
                <TouchableOpacity
                  key={categoryKey}
                  onPress={() => handleSelectCategory(categoryKey)}
                  className={`px-5 py-2 mx-1 rounded-full border items-center justify-center shadow-sm ${
                    isActive
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-200 active:bg-slate-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center py-10">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-500 mt-2 text-sm">
              Đang tải danh sách mẫu...
            </Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={(item, index) =>
              item.id?.toString() || item._id?.toString() || index.toString()
            }
            renderItem={({ item }) => (
              <TemplateItem
                onPress={() => handleDetailTemplate(item?.file_path, item.name)}
                name={item.name}
                description={item.description}
                category={item.categoryId || item.category?.name}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <View className="items-center justify-center py-12">
                <Text className="text-gray-500 text-base">
                  Không tìm thấy mẫu văn bản phù hợp
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </Base>
  );
};

export default HomeScreen;