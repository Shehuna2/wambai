import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Product, Shop } from '../../types';

export const BuyerHomeScreen = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.get('/shops/').then(r => setShops(r.data)).catch(() => setShops([]));
    api.get('/products/').then(r => setProducts(r.data)).catch(() => setProducts([]));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Welcome {user?.email ?? 'Buyer'}</Text>
        <Text>Default currency: {user?.profile?.default_currency ?? 'NGN'}</Text>
      </View>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Categories</Text>
        <Text>Clothing • Wool • Fabric • Other</Text>
      </View>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Featured Shops</Text>
        {shops.slice(0, 5).map(shop => <Text key={shop.id}>• {shop.name}</Text>)}
      </View>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Featured Products</Text>
        {products.slice(0, 8).map(product => <Text key={product.id}>• {product.title} ({product.price_cents / 100} {product.currency})</Text>)}
      </View>
    </ScrollView>
  );
};
