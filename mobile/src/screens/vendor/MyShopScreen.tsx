import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../../api/client';

export const MyShopScreen = () => {
  const [shop, setShop] = useState<any>(null);
  useEffect(() => {
    api.get('/shops/').then(({ data }) => setShop(Array.isArray(data) ? data[0] : null)).catch(() => setShop(null));
  }, []);
  return <View style={{ padding: 16 }}><Text style={{ fontSize: 18, fontWeight: '700' }}>My Shop</Text><Text>{shop ? `${shop.name} - ${shop.location}` : 'Create your shop from backend API'}</Text></View>;
};
