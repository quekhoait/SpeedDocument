import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  FileText,
  Mic,
  PenTool,
  ArrowRight,
} from "lucide-react-native";
import Base from "../layout/Base";
import { useNavigation } from '@react-navigation/native';

const PENDING_DOCS_DATA = [
  {
    id: "doc-001",
    title: "Hợp đồng Dịch vụ 2026",
    sender: "Ban Giám đốc",
    time: "2 giờ trước",
    type: "pdf",
    status: 1,
  },
  {
    id: "doc-002",
    title: "Quyết định bổ nhiệm Nhân sự",
    sender: "Phòng HR",
    time: "Hôm qua",
    type: "doc",
    status: 1,
  },
  {
    id: "doc-003",
    title: "Biên bản nghiệm thu dự án A",
    sender: "Phòng Kế toán",
    time: "3 ngày trước",
    type: "pdf",
    status: 0,
  },
];

const CreateDocumentScreen = () => {
  const navigate = useNavigation();

  const handleDocPress = (item) => {
    navigate.navigate("draft");
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
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text>
              <Text className="text-gray-500 text-xl">Chào, </Text>
              <Text className="text-2xl font-bold text-gray-900">
                Nguyễn Văn A
              </Text>
            </Text>
          </View>
        </View>

        {/* KHỐI TẠO VĂN BẢN & RA LỆNH */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity 
            onPress={() => navigate.navigate("draft")} 
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
            onPress={() => navigate.navigate("voice")} 
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

        {/* NÚT KÝ ĐIỆN TỬ (ĐÃ SỬA OPRESS) */}
        <TouchableOpacity 
         onPress={() => navigate.navigate("signature")}
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
          <Text className="text-2xl font-bold text-gray-900">Chờ bạn ký</Text>
          <TouchableOpacity>
            <Text className="text-sm font-semibold text-teal-600 tracking-wider">
              XEM TẤT CẢ
            </Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-3">
          {PENDING_DOCS_DATA.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleDocPress(item)}
              className="flex-row items-center my-2 justify-between bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm"
            >
              <View className="flex-row items-center flex-1 pr-2">
                <View className="flex-1">
                  <Text
                    className="text-base font-bold text-gray-900"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Gửi bởi: {item.sender}
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <View className="bg-teal-100/70 px-2.5 py-1 rounded-lg mb-1">
                  <Text className="text-xs font-semibold text-teal-700">
                    {item.status}
                  </Text>
                </View>
                <Text className="text-xs text-gray-400">{item.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Base>
  );
};

export default CreateDocumentScreen;