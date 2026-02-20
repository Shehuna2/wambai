import React, { useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';

import { api } from '../../api/client';

const currencies = ['NGN', 'XOF', 'XAF', 'GHS', 'USD', 'GBP', 'EUR'];

export const CheckoutScreen = () => {
  const [method, setMethod] = useState<'WALLET' | 'FINCRA'>('WALLET');
  const [currency, setCurrency] = useState('NGN');
  const [message, setMessage] = useState('');

  const submit = async () => {
    try {
      const payload: any = { payment_method: method };
      if (method === 'WALLET') payload.wallet_currency = currency;
      const { data } = await api.post('/checkout/', payload);
      if (data.status === 'PAID') setMessage('Order paid. Redirecting to confirmation.');
      else setMessage('Waiting for conversion/payment confirmation. Pull to refresh orders.');
    } catch (err: any) {
      setMessage(err?.response?.data?.detail ?? 'Checkout failed');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontWeight: '700', fontSize: 18 }}>Checkout</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Wallet" onPress={() => setMethod('WALLET')} />
        <Button title="Fincra" onPress={() => setMethod('FINCRA')} />
      </View>
      {method === 'WALLET' && (
        <View style={{ gap: 8 }}>
          <Text>Select wallet currency</Text>
          {currencies.map(code => (
            <Button key={code} title={code + (currency === code ? ' ✓' : '')} onPress={() => setCurrency(code)} />
          ))}
          {currency !== 'NGN' && <Text>Converted to NGN at checkout.</Text>}
        </View>
      )}
      <Button title="Place order" onPress={submit} />
      {!!message && <Text>{message}</Text>}
    </ScrollView>
  );
};
