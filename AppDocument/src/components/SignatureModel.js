import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, useWindowDimensions } from "react-native";
import SignatureCanvas from "react-native-signature-canvas";
import { Check, CheckCircle2, Maximize2, RotateCcw, X } from "lucide-react-native";

const webStyle = `.m-signature-pad { box-shadow: none; border: none; background-color: transparent; } .m-signature-pad--body { border: none; } .m-signature-pad--footer { display: none; margin: 0; }`;

const SignatureModal = ({ visible, onClose, onConfirm, title = "Ký tên xác nhận" }) => {
  const { width, height } = useWindowDimensions();
  const sigRef = useRef(null);
  const landRef = useRef(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const handleSave = async (base64) => {
    if (!base64) {
      Alert.alert("Thông báo", "Vui lòng vẽ chữ ký!");
      return;
    }

    setIsSaving(true);
    try {
      await onConfirm(base64);
      setIsLandscape(false);
      onClose();
    } catch (err) {
      Alert.alert("Lỗi", err?.message || "Không thể lưu chữ ký!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !isSaving && onClose()}>
      <View className="flex-1 bg-black/60 items-center justify-center px-4">
        
        <Modal visible={isLandscape} transparent={false} animationType="fade" onRequestClose={() => setIsLandscape(false)}>
          <View
            className="bg-white flex-row"
            style={{
              width: height,
              height: width,
              transform: [
                { rotate: "90deg" },
                { translateX: (height - width) / 2 },
                { translateY: (height - width) / 2 },
              ],
            }}
          >
            <View className="w-4/5 h-full bg-slate-50 border-r border-slate-200">
              <SignatureCanvas
                ref={landRef}
                onOK={handleSave}
                webStyle={webStyle}
                penColor="#0f172a"
                minWidth={2}
                maxWidth={4}
              />
            </View>

            <View className="w-1/5 h-full p-3 justify-between bg-white">
              <TouchableOpacity
                disabled={isSaving}
                onPress={() => setIsLandscape(false)}
                className="w-full py-3 bg-slate-100 rounded-xl items-center border border-slate-200"
              >
                <X size={20} color="#475569" />
                <Text className="text-slate-600 text-xs font-semibold mt-1">Đóng</Text>
              </TouchableOpacity>

              <View className="gap-3">
                <TouchableOpacity
                  disabled={isSaving}
                  onPress={() => landRef.current?.clearSignature()}
                  className="w-full py-3.5 bg-amber-50 rounded-xl items-center border border-amber-200"
                >
                  <RotateCcw size={18} color="#d97706" />
                  <Text className="text-amber-700 text-xs font-bold mt-1">Vẽ lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isSaving}
                  onPress={() => landRef.current?.readSignature()}
                  className={`w-full py-4 rounded-xl items-center ${isSaving ? "bg-teal-400" : "bg-teal-600"}`}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Check size={20} color="#fff" />
                      <Text className="text-white text-xs font-bold mt-1">Xong</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View className="w-full bg-white rounded-3xl p-5 shadow-xl">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-slate-900">{title}</Text>
            <TouchableOpacity disabled={isSaving} onPress={onClose} className="p-1.5 rounded-full bg-slate-100">
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View className="h-56 bg-slate-50 rounded-2xl border-2 border-dashed border-teal-200 overflow-hidden relative">
            <SignatureCanvas
              ref={sigRef}
              onOK={handleSave}
              webStyle={webStyle}
              penColor="#0f172a"
              minWidth={1.5}
              maxWidth={3}
            />
            <TouchableOpacity
              onPress={() => setIsLandscape(true)}
              className="absolute bottom-3 right-3 bg-white/90 border border-teal-200 px-3 py-1 rounded-full flex-row items-center"
            >
              <Maximize2 size={12} color="#0d9488" />
              <Text className="text-teal-700 text-xs font-semibold ml-1">Xoay ngang</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              disabled={isSaving}
              onPress={() => sigRef.current?.clearSignature()}
              className="flex-1 py-3 bg-slate-100 border border-slate-200 rounded-xl flex-row items-center justify-center"
            >
              <RotateCcw size={16} color="#475569" />
              <Text className="text-slate-700 text-xs font-semibold ml-1.5">Vẽ lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isSaving}
              onPress={() => sigRef.current?.readSignature()}
              className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${isSaving ? "bg-teal-400" : "bg-teal-600"}`}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#fff" />
                  <Text className="text-white text-xs font-bold ml-1.5">Xác nhận</Text>
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