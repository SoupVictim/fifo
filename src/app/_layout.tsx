import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FifoProvider } from '../store/FifoContext';
import { FloatingTabBar } from '../components/FloatingTabBar';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FifoProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          <Slot />
          <FloatingTabBar />
        </View>
      </FifoProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
