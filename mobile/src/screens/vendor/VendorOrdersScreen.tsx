import React, { useEffect, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import { api } from '../../api/client';

export const VendorOrdersScreen = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const load = () => api.get('/vendor/orders/').then(r => setOrders(r.data));
  useEffect(() => {
    load().catch(() => setOrders([]));
  }, []);

  return <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
    <Text style={{ fontWeight: '700', fontSize: 18 }}>Vendor Orders</Text>
    {orders.map(order => (
      <View key={order.id} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}>
        <Text>Order #{order.order} - {order.status}</Text>
        <Button title="Mark Processing" onPress={async () => { await api.patch(`/vendor/orders/${order.id}/`, { status: 'PROCESSING' }); await load(); }} />
      </View>
    ))}
  </ScrollView>;
};
