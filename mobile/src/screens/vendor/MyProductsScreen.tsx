import React, { useEffect, useState } from 'react';
import { Button, ScrollView, Text } from 'react-native';
import { api } from '../../api/client';

export const MyProductsScreen = () => {
  const [products, setProducts] = useState<any[]>([]);
  const load = () => api.get('/products/').then(r => setProducts(r.data));
  useEffect(() => {
    load().catch(() => setProducts([]));
  }, []);
  return <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
    <Text style={{ fontSize: 18, fontWeight: '700' }}>My Products</Text>
    {products.map(product => <Text key={product.id}>{product.title}</Text>)}
    <Button title="Create sample product" onPress={async () => {
      await api.post('/products/', { shop: 1, title: `New product ${Date.now()}`, price_cents: 1000, category: 'other', unit: 'piece', stock_qty: 5, min_order_qty: 1, qty_step: 1 });
      await load();
    }} />
  </ScrollView>;
};
