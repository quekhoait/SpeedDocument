import { Trash2 } from "lucide-react-native";
import { Image, TouchableOpacity, View } from "react-native";

const SignatureItem = ({ item, index }) => (
  <View className="bg-white p-4 rounded-2xl border border-slate-200 mb-3 shadow-sm flex-row items-center justify-between">
    <View className="flex-1">
      <Text className="text-xs font-semibold text-teal-600 mb-2">
        Hình ảnh chữ ký #{savedSignatures.length - index} ({item.createdAt})
      </Text>

      <View className="h-24 bg-slate-50 rounded-xl border border-slate-100 p-2 justify-center items-center">
        <Image
          source={{ uri: item.imageUri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>
    </View>

    <TouchableOpacity
      onPress={() => handleDeleteSaved(item.id)}
      className="ml-3 p-3 bg-red-50 rounded-xl border border-red-100"
    >
      <Trash2 size={18} color="#ef4444" />
    </TouchableOpacity>
  </View>
);

export default SignatureItem;
