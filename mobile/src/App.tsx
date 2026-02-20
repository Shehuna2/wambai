import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';

const Root = () => {
  const { loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <AppNavigator />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
