import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const ModeSwitch = () => {
  const { mode, setMode } = useAuth();
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {(['BUYER', 'VENDOR'] as const).map(option => (
        <Pressable
          key={option}
          onPress={() => setMode(option)}
          style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: mode === option ? '#2563eb' : '#e5e7eb' }}>
          <Text style={{ color: mode === option ? 'white' : '#111827' }}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
};
