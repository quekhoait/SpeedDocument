import React, { createContext, useState, useEffect } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authServices';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchCurrentUser = async () => {
  try {
    setLoadingUser(true);
    let token = await AsyncStorage.getItem('access_token');
    if (!token) {
      setCurrentUser(null);
      return;
    }

    try {
      const response = await authService.currentUser(token)
      const userData = response.data?.user
      setCurrentUser(userData);
    } catch (error) {
      if (error.response && error.response.status === 401) {        
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error("Không tìm thấy refresh token");
        }
        const refreshResponse = authService.refreshToken(refreshToken)
        const newAccessToken = refreshResponse.data?.data?.access_token;
        const newRefreshToken = refreshResponse.data?.data?.refresh_token;

        if (newAccessToken && newRefreshToken) {
          await AsyncStorage.setItem('access_token', newAccessToken);
          await AsyncStorage.setItem('refresh_token', newRefreshToken);

          const retryResponse =authService.currentUser(newAccessToken)
          const userData = retryResponse.data?.data || retryResponse.data;
          setCurrentUser(userData);
        } else {
          throw new Error("Dữ liệu trả về từ API Refresh không hợp lệ");
        }
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.log("Không thể lấy thông tin user sau khi thử refresh:", error.message);
    setCurrentUser(null);
    
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
  } finally {
    setLoadingUser(false);
  }
};

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, loadingUser, refreshUser: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};