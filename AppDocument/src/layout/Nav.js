import React, { useContext } from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import { Home, FileText, User } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { AuthContext } from '../context/AuthContext'
import AsyncStorage from '@react-native-async-storage/async-storage'

const NAV_ITEMS = [
  { id: 0, label: 'Trang chủ', icon: Home, link: 'home' },
  { id: 1, label: 'Tạo', icon: FileText, link: 'create-document' },
  { id: 2, label: 'Tài khoản', icon: User, link: 'profile' },
]

const Nav = ({ activeTab = 0 }) => {
  const { currentUser } = useContext(AuthContext);

  const insets = useSafeAreaInsets()
  const navigation = useNavigation()

  const handlePress = (item) => {
    if (!item) return;

    if (item.id === 2) {
      if (currentUser) {
        navigation.navigate('profile')
      } else {
        navigation.navigate('regis') 
      }
      return;
    }

    if (activeTab !== item.id) {
      navigation.navigate(item.link)
    }
  }

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View className="flex-row justify-between items-center px-4 pt-3">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id
          const IconComponent = item.icon

          const displayLabel =
            item.id === 2 && currentUser?.username
              ? currentUser.username
              : item.label

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
              className={`flex-1 mx-1 py-2 rounded-2xl items-center justify-center ${
                isActive ? 'bg-blue-50' : 'bg-transparent'
              }`}
            >
              <IconComponent size={22} color={isActive ? '#2563eb' : '#64748b'} />
              <Text
                numberOfLines={1}
                className={`text-[11px] mt-1 text-center font-medium ${
                  isActive ? 'text-blue-600 font-semibold' : 'text-slate-500'
                }`}
              >
                {displayLabel}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export default Nav