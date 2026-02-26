import React, { useEffect, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';

import { api } from '../../api/client';
import { Order, OrderDetail } from '../../types';

export const BuyerOrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    setMessage('');
    try {
      const { data } = await api.get('/orders/');
      setOrders(data);
    } catch (err: any) {
      setMessage(err?.response?.data?.detail ?? 'Unable to load orders');
      setOrders([]);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const openOrder = async (id: number) => {
    setMessage('');
    try {
      const { data } = await api.get(`/orders/${id}/`);
      setSelectedOrder(data);
    } catch (err: any) {
      setMessage(err?.response?.data?.detail ?? 'Unable to load order detail');
    }
  };

  if (selectedOrder) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Button title="Back to orders" onPress={() => setSelectedOrder(null)} />
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Order #{selectedOrder.id}</Text>
        <Text>Status: {selectedOrder.status}</Text>
        <Text>Payment: {selectedOrder.payment_method}</Text>
        <Text>Total (NGN minor): {selectedOrder.total_ngn_cents}</Text>
        <Text>{new Date(selectedOrder.created_at).toLocaleString()}</Text>
        <Text style={{ fontWeight: '700', marginTop: 8 }}>Vendor splits</Text>
        {(selectedOrder.vendor_orders ?? []).map(vo => (
          <View key={vo.id} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, gap: 4 }}>
            <Text style={{ fontWeight: '700' }}>{vo.shop_name ?? `Shop #${vo.shop}`}</Text>
            <Text>Status: {vo.status}</Text>
            <Text>Subtotal (NGN minor): {vo.subtotal_ngn_cents}</Text>
            {(vo.items ?? []).map(item => (
              <View key={item.id} style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 6, padding: 8 }}>
                <Text>{item.product_snapshot?.title ?? 'Item'}</Text>
                <Text>Qty: {item.qty}</Text>
                <Text>Line total: {item.line_total_ngn_cents}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontWeight: '700', fontSize: 18 }}>My Orders</Text>
      <Button title="Refresh" onPress={() => load()} />
      {!!message && <Text>{message}</Text>}
      {!message && !orders.length && <Text>No orders yet.</Text>}
      {orders.map(order => (
        <View key={order.id} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, gap: 4 }}>
          <Text style={{ fontWeight: '700' }}>Order #{order.id}</Text>
          <Text>Status: {order.status}</Text>
          <Text>Payment: {order.payment_method}</Text>
          <Text>Total (NGN minor): {order.total_ngn_cents}</Text>
          <Text>{new Date(order.created_at).toLocaleString()}</Text>
          <Button title="View details" onPress={() => openOrder(order.id)} />
        </View>
      ))}
    </ScrollView>
  );
};
