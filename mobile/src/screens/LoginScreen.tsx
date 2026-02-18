import React, { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Wambai</Text>
      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 8 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, padding: 8 }} />
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button title="Login" onPress={async () => {
        try {
          setError(null);
          await login(email, password);
        } catch {
          setError('Unable to login. Check credentials.');
        }
      }} />
    </View>
  );
};
