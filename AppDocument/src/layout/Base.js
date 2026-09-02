import React from 'react';
import Header from './Header';
import Nav from './Nav';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import BackHeader from '../components/BackHeaderComponent';

const Base = ({ children, headerTitle, activeTab = 0, hasHeader, hasNav }) => {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {hasHeader ? <Header title={headerTitle} /> : <BackHeader title={headerTitle} />}
      <View style={{ flex: 1 }}>
        {children}
      </View>
      {hasNav && <Nav activeTab={activeTab} />}
    </SafeAreaView>
  );
};

export default Base;