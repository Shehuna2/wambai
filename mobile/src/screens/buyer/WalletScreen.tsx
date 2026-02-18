import React, { useEffect, useState } from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { api } from '../../api/client';
import { WalletBalance } from '../../types';

const currencies = ['NGN', 'XOF', 'XAF', 'GHS', 'USD', 'GBP', 'EUR'];

export const WalletScreen = () => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [currency, setCurrency] = useState('NGN');
  const [amount, setAmount] = useState('100000');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const load = () => api.get('/wallet/').then(r => {
    setBalances(r.data.balances ?? []);
    setLedger(r.data.recent_ledger ?? []);
  });

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  if (checkoutUrl) {
    return <WebView source={{ uri: checkoutUrl }} onNavigationStateChange={load} />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontWeight: '700', fontSize: 18 }}>Wallet balances</Text>
      {currencies.map(code => {
        const balance = balances.find(b => b.currency === code)?.available_cents ?? 0;
        return <Text key={code}>{code}: {balance / 100}</Text>;
      })}
      <View style={{ gap: 8 }}>
        <Text>Top-up Currency ({currencies.join(', ')})</Text>
        <TextInput value={currency} onChangeText={setCurrency} style={{ borderWidth: 1, padding: 8 }} />
        <TextInput value={amount} onChangeText={setAmount} keyboardType="number-pad" style={{ borderWidth: 1, padding: 8 }} />
        <Button title="Initialize top-up" onPress={async () => {
          const { data } = await api.post('/wallet/topup/init/', { currency, amount_cents: Number(amount) });
          setCheckoutUrl(data.checkout_url);
        }} />
      </View>
      <Text style={{ fontWeight: '700' }}>Transactions</Text>
      {ledger.map((entry, index) => <Text key={index}>{entry.type} {entry.amount_cents / 100} {entry.currency} ({entry.status})</Text>)}
    </ScrollView>
  );
};
