import React from 'react';
import Header from './Header';
import Nav from './Nav';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import BackHeader from '../components/BackHeaderComponent';

const Base = ({ children, headerTitle, activeTab = 0, hasHeader}) => {
  return (
    <SafeAreaView className="flex-1">
      {hasHeader ? <Header title={headerTitle}/> : <BackHeader title={headerTitle} />}
      <View className="flex-1">
        {children}
      </View>
      <Nav activeTab={activeTab}/>
    </SafeAreaView>
  );
};
export default Base;