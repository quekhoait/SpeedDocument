import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ArrowLeft, RotateCw } from 'lucide-react-native';
import Base from '../layout/Base';

const PreviewScreen = ({ route, navigation }) => {
  const { previewUrl, fileUrl, title = 'Xem trước tài liệu' } = route.params || {};
  const [key, setKey] = useState(0);

  const getTargetUrl = () => {
    const rawUrl = previewUrl || fileUrl;
    if (!rawUrl) return '';
    
    if (rawUrl.includes('docs.google.com/gview')) {
      return rawUrl;
    }
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(rawUrl)}`;
  };

  const targetUrl = getTargetUrl();

  const handleReload = () => {
    setKey((prev) => prev + 1);
  };


  return (
    <Base hasHeader={false} activeTab={0} headerTitle="Preview">
      <View className="flex-1 bg-slate-50">
        {targetUrl ? (
          <WebView
            key={key}
            source={{ uri: targetUrl }}
            startInLoadingState={true}
            renderLoading={() => (
              <View className="absolute inset-0 justify-center items-center bg-white z-10">
                <ActivityIndicator size="large" color="#0d9488" />
                <Text className="text-slate-500 text-sm mt-3 font-medium">
                  Đang tải văn bản...
                </Text>
              </View>
            )}
            onError={() => (
              <View className="flex-1 justify-center items-center p-6">
                <Text className="text-slate-600 text-center font-medium mb-3">
                  Không thể tải bản xem trước vào lúc này.
                </Text>
                <TouchableOpacity 
                  onPress={handleReload}
                  className="px-4 py-2 bg-teal-600 rounded-xl"
                >
                  <Text className="text-white font-semibold">Tải lại trang</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-slate-500 font-medium">
              Không tìm thấy đường dẫn tài liệu hợp lệ!
            </Text>
          </View>
        )}
      </View>
    </Base>
  );
};

export default PreviewScreen;