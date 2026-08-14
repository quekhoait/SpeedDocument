import React, { useState, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { CheckCircle2, RotateCcw, Image as ImageIcon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Base from '../layout/Base';
import SignatureItem from '../components/SignatureItem';
import { authService } from '../services/authServices';
import { AuthContext } from '../context/AuthContext';

const SignatureScreen = ({ navigation }) => {
  const signatureRef = useRef(null);
  const [savedSignatures, setSavedSignatures] = useState([]);

  const { currentUser } = useContext(AuthContext);

  const handleTriggerSave = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature(); 
    }
  };

  const handleOK = async (signatureImageBase64) => {
    if (!signatureImageBase64) {
      Alert.alert('Thông báo', 'Vui lòng vẽ chữ ký trước khi xuất!');
      return;
    }

    const newSignature = {
      id: Date.now().toString(),
      imageUri: signatureImageBase64,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSavedSignatures((prev) => [newSignature, ...prev]);

    try {
        const  token = await AsyncStorage.getItem('access_token');
      
      const response = await authService.saveSignature(token, signatureImageBase64);

      const resData = response?.data || response;

      if (resData && (resData.status === 'OK' || response.status === 200)) {
        Alert.alert('Thành công', 'Đã lưu chữ ký cá nhân vào tài khoản!', [
          { text: 'OK', onPress: () => navigation?.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', resData?.message || 'Không thể lưu chữ ký lên máy chủ!');
      }
    } catch (error) {
      console.error('Lỗi khi lưu chữ ký:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi kết nối với máy chủ.');
    }
  };

  // 3. Xóa nét vẽ để ký lại
  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  };

  // 4. Xóa chữ ký trong danh sách đã lưu
  const handleDeleteSaved = (id) => {
    setSavedSignatures((prev) => prev.filter((item) => item.id !== id));
  };

  const webStyle = `.m-signature-pad { 
    box-shadow: none; 
    border: none; 
    background-color: transparent; 
  }
  .m-signature-pad--body { 
    border: none; 
  }
  .m-signature-pad--footer { 
    display: none; margin: 0px; 
  }`;

  return (
    <Base hasHeader={false} activeTab={1} headerTitle="TẠO CHỮ KÝ">
      <View className="flex-1 px-6 py-4">
        <FlatList
          showsVerticalScrollIndicator={false}
          data={savedSignatures}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SignatureItem 
              item={item} 
              onDelete={() => handleDeleteSaved(item.id)} 
            />
          )}
          ListHeaderComponent={
            <View>
              <Text className="text-gray-900 text-2xl font-bold text-center mb-1 mt-2">
                Vẽ chữ ký điện tử
              </Text>
              <Text className="text-slate-500 text-xs text-center mb-4">
                Dùng ngón tay để vẽ chữ ký và xuất thành hình ảnh PNG
              </Text>

              {/* Khung vẽ chữ ký */}
              <View className="h-60 bg-slate-50 rounded-3xl border-2 border-dashed border-teal-200 overflow-hidden shadow-sm my-2 relative">
                <SignatureCanvas
                  ref={signatureRef}
                  onOK={handleOK}
                  webStyle={webStyle}
                  penColor="#0f172a"
                  minWidth={1.5}
                  maxWidth={3}
                />
                <View className="absolute bottom-6 left-8 right-8 h-[1px] bg-slate-300 pointer-events-none" />
              </View>

              {/* Hàng nút bấm hành động */}
              <View className="flex-row gap-3 my-4">
                <TouchableOpacity
                  onPress={handleClear}
                  activeOpacity={0.7}
                  className="flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-2xl bg-slate-100 border border-slate-200"
                >
                  <RotateCcw size={18} color="#475569" />
                  <Text className="text-slate-700 font-semibold text-sm ml-2">
                    Xóa vẽ lại
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTriggerSave}
                  activeOpacity={0.8}
                  className="flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-2xl bg-teal-600 shadow-sm"
                >
                  <CheckCircle2 size={18} color="#ffffff" />
                  <Text className="text-white font-bold text-sm ml-2">
                    Xuất thành ảnh
                  </Text>
                </TouchableOpacity>
              </View>

              {savedSignatures.length > 0 && (
                <View className="flex-row items-center my-3">
                  <ImageIcon size={18} color="#0d9488" />
                  <Text className="text-gray-900 font-bold text-base ml-2">
                    Hình ảnh chữ ký đã lưu ({savedSignatures.length})
                  </Text>
                </View>
              )}
            </View>
          }
        />
      </View>
    </Base>
  );
};

export default SignatureScreen;