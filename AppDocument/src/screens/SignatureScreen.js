import React, { useState, useRef, useContext, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, Image, ActivityIndicator } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { CheckCircle2, RotateCcw, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Base from '../layout/Base';
import SignatureItem from '../components/SignatureItem';
import { authService } from '../services/authServices';
import { AuthContext } from '../context/AuthContext';

const SignatureScreen = ({ navigation }) => {
  const { currentUser, setCurrentUser, refreshUser} = useContext(AuthContext);
  const signatureRef = useRef(null);
  const [savedSignatures, setSavedSignatures] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const userSignature = useMemo(() => {
    if (!currentUser?.signature) return null;
    try {
      if (currentUser.signature === 'string') {
        return JSON.parse(currentUser.signature);
      }
      return currentUser.signature;
    } catch (e) {
      console.error('Lỗi parse signature:', e);
      return null;
    }
  }, [currentUser]);

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
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await authService.saveSignature(token, signatureImageBase64);
      const resData = response?.data;

      if (resData && resData.status === 'OK') {
        if (setCurrentUser && resData.data) {
          setCurrentUser(prev => ({
            ...prev,
            signature: resData.data.signature || resData.data
          }));
        }

        const newSig = {
          id: Date.now().toString(),
          imageUri: signatureImageBase64,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setSavedSignatures((prev) => [newSig, ...prev]);

        Alert.alert('Thành công', 'Đã lưu chữ ký cá nhân vào tài khoản!')
        refreshUser()
      } else {
        Alert.alert('Lỗi', resData?.message || 'Không thể lưu chữ ký lên máy chủ!');
      }
    } catch (error) {
      console.error('Lỗi khi lưu chữ ký:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi kết nối với máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  };

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

              <View className="flex-row gap-3 my-4">
                <TouchableOpacity
                  onPress={handleClear}
                  activeOpacity={0.7}
                  disabled={isSaving}
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
                  disabled={isSaving}
                  className={`flex-1 flex-row items-center justify-center py-3.5 px-4 rounded-2xl shadow-sm ${
                    isSaving ? 'bg-teal-400' : 'bg-teal-600'
                  }`}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#ffffff" />
                      <Text className="text-white font-bold text-sm ml-2">
                        Xuất thành ảnh
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {userSignature?.url && (
                <View className="mb-4 bg-white p-4 rounded-3xl border border-teal-100 shadow-sm">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <ImageIcon size={18} color="#0d9488" />
                      <Text className="text-slate-800 font-bold text-sm ml-2">
                        Chữ ký của bạn
                      </Text>
                    </View>
                    {userSignature.updatedAt && (
                      <Text className="text-[11px] text-slate-400">
                        {new Date(userSignature.updatedAt).toLocaleDateString('vi-VN')}
                      </Text>
                    )}
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
      </View>
    </Base>
  );
};

export default SignatureScreen;