import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ButtonComponent from "../components/ButtonComponent";
import { authService } from "../services/authServices";
import { AuthContext } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = () => {
  const { refreshUser } = useContext(AuthContext);
  const [user, setUser] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const userInfo = [
    {
      id: "email",
      fields: "emaill",
      placeholder: "email",
      icon: null,
    },
    {
      id: "password",
      fields: "Password",
      placeholder: "password",
      icon: null,
    },
  ];

  const handleLoginWithEmail= async()=>{
    const {email, password} = user;
    if(!email || !password){
      Alert.alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
     setLoading(true)
     try{
      const loginPayload = {
        email: email,
        password: password
      }
      const response = await authService.loginWithEmail(loginPayload)
      console.log(response)
      if(response){
        const { accessToken, refreshToken } = response.data;
       
        if (accessToken && refreshToken) {
            await AsyncStorage.setItem('access_token',accessToken);
            await AsyncStorage.setItem('refresh_token',refreshToken);
        }
        Alert.alert('Thành công', 'Đăng nhập thành công!')
        await refreshUser()
        navigation.navigate('home')
      }else{
          Alert.alert('Thất bại', response?.data.message)
      }
     }catch (error) {
    console.error("Lỗi đăng nhập:", error);
    
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã có lỗi xảy ra, vui lòng thử lại!";
      
    Alert.alert("Lỗi", errorMessage);
  } finally {
    setLoading(false);
  }
  }

  return (
    <ScrollView
      className="bg-gray-300"
      contentContainerStyle={{
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1,
        paddingVertical: 8,
        paddingHorizontal: 1,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <KeyboardAvoidingView behavior="padding" className="w-full px-4">
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <Text className="text-3xl text-center font-bold text-gray-900 pb-4">
            AI Documnet
          </Text>
          <Text className="text-lg text-center text-gray-900 p2-4">
            Đăng nhập để tạo tài liệu
          </Text>
          <View className="mt-2 space-y-4">
            {userInfo.map((item) => (
              <View className=" py-2" key={item.id}>
                <Text className="text-xl font-semibold text-gray-700 mb-2">
                  {item.fields}
                </Text>
                <TextInput
                  className="bg-slate-100 px-4 py-4 text-gray-700 text-base border-blue-200"
                  placeholder={item.placeholder}
                  placeholderTextColor="#94a3b8"
                  value={user[item.id]}
                  editable={!loading}
                  onChangeText={(t) => setUser({ ...user, [item.id]: t })}
                  secureTextEntry={item.fields.includes("Password")}
                />
              </View>
            ))}
          </View>

          <ButtonComponent
            title={loading ? "Đang xử lý..." : "Đăng nhập"}
            onPress={handleLoginWithEmail}
            disabled={loading}
            loading={loading}
            textColor="#ffffff"
            backgroundColor="#333"
            style={{
              marginTop: 24,
              borderRadius: 4,
              opacity: loading ? 0.7 : 1,
            }}
          />

          <View className="h-[1px] w-full bg-slate-400 my-6" />

          <View className="flex-row justify-between space-x-3">
            <TouchableOpacity
              // onPress={handleLoginGoogle}
              disabled={loading}
              className={`flex-1 flex-row items-center justify-center bg-slate-300 py-3 ${loading ? "opacity-50" : ""}`}
            >
              <Text className="text-base">🌐</Text>
              <Text className="ml-3 text-xl font-semibold text-gray-700">
                Google
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-gray-500">
              Bạn chưa có tài khoản?{" "}
            </Text>
            <TouchableOpacity disabled={loading}>
              <Text
                className="text-sm font-semibold text-blue-600"
                onPress={() => navigation.navigate("regis")}
              >
                Đăng ký ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

export default Login;
