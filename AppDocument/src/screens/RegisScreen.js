import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import ButtonComponent from '../components/ButtonComponent'
import { authService } from '../services/authServices'

const Register = () => {
  const navigation = useNavigation()

  const [user, setUser] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [otpCode, setOtpCode] = useState('')
  const [otpSend, setOtpSend] = useState(false)
  const [loading, setLoading] = useState(false)

  const userInfo = [
    {
      id: 'username',
      fields: 'Username',
      placeholder: 'username',
      keyboardType: 'default',
    },
    {
      id: 'password',
      fields: 'Password',
      placeholder: 'password',
      secureTextEntry: true,
    },
    {
      id: 'confirmPassword',
      fields: 'Confirm Password',
      placeholder: 'confirm password',
      secureTextEntry: true,
    },
  ]

   const sendOTP = async () => {
    if (!user.email) {
      Alert.alert('Lỗi', 'Vui lòng nhập email')
      return
    }
    setLoading(true)
    try {
      await authService.sendOtp(user.email)
      setOtpSend(true)
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến email của bạn')
    } catch (error) {
      console.log(error?.response)
      Alert.alert(
        'Thất bại',
        error?.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    const { email, username, password, confirmPassword } = user

    if (!otpCode || !username || !password  || !email) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin!')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không trùng khớp.')
      return
    }
    setLoading(true)
    try {
      const registerPayload = {
        email: email,
        username: username,
        password: password,
        confirm_password: confirmPassword,
        otp: otpCode,
      }

      await authService.registerWithEmail(registerPayload)
      Alert.alert('Thành công', 'Đăng ký tài khoản thành công!')
      navigation.navigate('login')
    } catch (error) {
      console.error('ERROR MESSAGE:', error?.response)
      Alert.alert(
        'Thất bại',
        error?.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.'
      )
    } finally {
      setLoading(false)
    }
  }

 

  return (
    <View className="flex-1 bg-gray-300">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
          <KeyboardAvoidingView  behavior="padding" className="w-full px-4">
            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <Text className="text-3xl font-bold text-center text-gray-900 pb-2">Tạo tài khoản</Text>
              <Text className="text-base text-center text-gray-500 mb-2">
                Tạo tài khoản để có thể sử dụng các dịch vụ
              </Text>

              <View className="space-y-4">

                <View className="py-2">
                  <Text className="text-xl font-semibold text-gray-700 mb-2">Email</Text>
                  <View className="flex-row items-center">
                    <TextInput
                      className="flex-1 bg-slate-100 rounded-lg px-4 pl-4 py-4 text-gray-700 text-base mr-2"
                      placeholder="email"
                      placeholderTextColor="#94a3b8"
                      value={user.email}
                      onChangeText={(t) => setUser({ ...user, email: t })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={sendOTP}
                      disabled={loading}
                      className="bg-blue-500 rounded-lg px-4 py-4"
                    >
                      <Text className="text-white font-semibold">
                        {loading ? 'Đang gửi...' : 'Gửi OTP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {otpSend && (
                  <View className="py-2">
                    <Text className="text-xl font-semibold text-gray-700 mb-2">Mã OTP</Text>
                    <View className="flex-row items-center">
                      <TextInput
                        className="flex-1 bg-slate-100 px-4 py-4 text-gray-700 text-base mr-2"
                        placeholder="Nhập mã OTP"
                        placeholderTextColor="#94a3b8"
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}

                {userInfo.map((item) => (
                  <View className="py-2" key={item.id}>
                    <Text className="text-xl font-semibold text-gray-700 mb-2">
                      {item.fields}
                    </Text>
                    <TextInput
                      className="bg-slate-100 rounded-lg pl-4 px-4 py-4 text-gray-700 text-base border-blue-200"
                      placeholder={item.placeholder}
                      placeholderTextColor="#94a3b8"
                      value={user[item.id]}
                      onChangeText={(t) => setUser({ ...user, [item.id]: t })}
                      secureTextEntry={item.secureTextEntry || false}
                      keyboardType={item.keyboardType || 'default'}
                      autoCapitalize="none"
                    />
                  </View>
                ))}
              </View>

                <ButtonComponent
            title={loading ? "Đang xử lý..." : "Đăng ký"}
            onPress={handleRegister}
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
                <Text className="text-sm text-gray-500">Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('login')}>
                  <Text className="text-sm font-semibold text-blue-600">Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

export default Register