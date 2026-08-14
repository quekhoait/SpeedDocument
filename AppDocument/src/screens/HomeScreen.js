import React, { useEffect, useMemo, useState } from "react";
import { useNavigation } from '@react-navigation/native';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Searchbar } from "react-native-paper";
import Base from "../layout/Base";
import TemplateItem from "../components/HomeComponents/TemplateItem";
import { templateService } from "../services/templateServices";
import TemplatePreviewModal from "./PreviewScreen";

const ALL_CATEGORY = { id: "ALL", name: "Tất cả" };

const HomeScreen = () => {

  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([ALL_CATEGORY]);
  const [templates, setTemplates] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const fetchCategories = async () => {
    try {
      const response = await templateService.getAllCategory();
      const rawCategories = response?.data?.data;
      setCategories([ALL_CATEGORY, ...rawCategories]);
    } catch (error) {
      console.error("Lỗi khi lấy danh mục template:", error);
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể tải danh mục văn bản"
      );
    }
  };

  const fetchTemplates = async (categoryId) => {
    try {
      setIsLoading(true);
      let response;
      if (categoryId === "ALL") {
        response = await templateService.getTemplate(); 
      } else {
        console.log("id Categpry", categoryId)
        response = await templateService.getTemplate(categoryId);
      }
      
      const data = response?.data?.data 
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
    fetchTemplates(selectedCategoryId);
  }, [selectedCategoryId]);

  const handleDetailTemplate = (previewUrl, title = 'Đơn xin nghỉ việc') => {
  if (!previewUrl) {
    Alert.alert('Thông báo', 'Mẫu này chưa có đường dẫn xem trước.');
    return;
  }

  navigation.navigate('preview', {
    previewUrl: previewUrl,
    title: title,
  });
};

  // const filteredTemplates = useMemo(() => {
  //   if (!searchQuery.trim()) return templates;

  //   const query = searchQuery.toLowerCase().trim();
  //   return templates.filter(
  //     (item) =>
  //       item.name?.toLowerCase().includes(query) ||
  //       item.description?.toLowerCase().includes(query)
  //   );
  // }, [searchQuery, templates]);

  // const paginatedTemplates = useMemo(() => {
  //   return filteredTemplates.slice(0, visibleCount);
  // }, [filteredTemplates, visibleCount]);

  const handleSelectCategory = (cateId) => {
    setSelectedCategoryId(cateId);
    setVisibleCount(5);
  };

  const handleLoadMore = () => {
    if (isLoadingMore || visibleCount >= 3) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 5);
      setIsLoadingMore(false);
    }, 500);
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
          onChangeText={(text) => {
            setSearchQuery(text);
            setVisibleCount(5);
          }}
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
              onPress={()=>handleDetailTemplate(item.previewUrl)}
                name={item.name}
                description={item.description}
                category={item.categoryId || item.category?.name}
              />
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListFooterComponent={() =>
              isLoadingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text className="text-xs text-gray-500 mt-1">
                    Đang tải thêm...
                  </Text>
                </View>
              ) : null
            }
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