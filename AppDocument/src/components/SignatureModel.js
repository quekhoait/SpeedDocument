import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { CheckCircle2, RotateCcw, X } from 'lucide-react-native';
import { documentServices } from '../services/documentServices';

const webStyle = `.m-signature-pad { 
  box-shadow: none; 
  border: none; 
  background-color: transparent; 
}
.m-signature-pad--body { 
  border: none; 
}
.m-signature-pad--footer { 
  display: none; 
  margin: 0px; 
}`;

const SignatureModal = ({ visible, onClose, onSave, isSaving }) => {
  const signatureRef = useRef(null);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

   // Dùng chữ ký mới
   const handleSaveSignature = async (signatureImageBase64) => {
    if (!signatureImageBase64) {
      Alert.alert("Thông báo", "Vui lòng vẽ chữ ký trước khi xác nhận!");
      return;
    }

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      
      const response = await documentServices.updateSignature(
        token,
        selectedDoc?.id,
        signatureImageBase64
      );

      const resData = response?.data;
      console.log("================2222222222222222", resData)
      if (resData && (resData.status === "OK" || response?.status === 200)) {
        Alert.alert("Thành công", "Đã ký tài liệu thành công!");
        handleCloseSignature();
        fetchDocuments(); 
      } else {
        Alert.alert("Lỗi", resData?.message || "Không thể ký tài liệu!");
      }
    } catch (error) {
      console.error("Lỗi khi ký tài liệu:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi kết nối với máy chủ khi gửi chữ ký.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="w-full bg-white rounded-3xl p-5 shadow-xl">
          {/* Header Modal */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-gray-900 text-lg font-bold">Ký tên xác nhận</Text>
              <Text className="text-slate-500 text-xs">Vẽ chữ ký của bạn vào khung bên dưới</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              disabled={isSaving}
              className="p-1.5 rounded-full bg-slate-100"
            >
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Vùng Canvas */}
          <View className="h-56 bg-slate-50 rounded-2xl border-2 border-dashed border-teal-200 overflow-hidden relative">
            <SignatureCanvas
              ref={signatureRef}
              onOK={onSave}
              webStyle={webStyle}
              penColor="#0f172a"
              minWidth={1.5}
              maxWidth={3}
            />
            <View className="absolute bottom-6 left-6 right-6 h-[1px] bg-slate-300 pointer-events-none" />
          </View>

          {/* Nút hành động */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={handleClear}
              disabled={isSaving}
              activeOpacity={0.7}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-slate-100 border border-slate-200"
            >
              <RotateCcw size={16} color="#475569" />
              <Text className="text-slate-700 font-semibold text-xs ml-1.5">Vẽ lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveSignature}
              disabled={isSaving}
              activeOpacity={0.8}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                isSaving ? 'bg-teal-400' : 'bg-teal-600'
              }`}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#ffffff" />
                  <Text className="text-white font-bold text-xs ml-1.5">Xác nhận ký</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SignatureModal;