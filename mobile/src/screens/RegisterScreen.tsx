import React, { useState } from 'react';
import { Button, Switch, Text, TextInput, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

type RegisterScreenProps = {
  onShowLogin?: () => void;
};

export const RegisterScreen = ({ onShowLogin }: RegisterScreenProps) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isVendor, setIsVendor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Create account</Text>
      <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 8 }} />
      <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} style={{ borderWidth: 1, padding: 8 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ borderWidth: 1, padding: 8 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text>Register as Vendor</Text>
        <Switch value={isVendor} onValueChange={setIsVendor} />
      </View>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      <Button
        title="Register"
        onPress={async () => {
          try {
            setError(null);
            await register(email, phone, password, isVendor);
          } catch {
            setError('Unable to register. Please check your input.');
          }
        }}
      />
      {onShowLogin && <Button title="Back to login" onPress={onShowLogin} />}
    </View>
  );
};
