import React, { useEffect, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import { api } from '../../api/client';

export const CartScreen = () => {
  const [grouped, setGrouped] = useState<Record<string, any>>({});

  const load = () => api.get('/cart/').then(r => setGrouped(r.data.grouped_by_shop ?? {}));

  useEffect(() => {
    load().catch(() => setGrouped({}));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {Object.values(grouped).map((group: any) => (
        <View key={group.shop.id} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: '700' }}>{group.shop.name}</Text>
          {group.items.map((item: any) => <Text key={item.id}>{item.product.title} x {item.qty}</Text>)}
        </View>
      ))}
      <Button
        title="Checkout with Wallet NGN"
        onPress={() => api.post('/checkout/', { payment_method: 'WALLET', wallet_currency: 'NGN' }).then(load)}
      />
    </ScrollView>
  );
};
