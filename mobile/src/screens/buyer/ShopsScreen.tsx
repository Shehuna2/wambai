import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { api } from '../../api/client';
import { Shop } from '../../types';

export const BuyerShopsScreen = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  useEffect(() => {
    api.get('/shops/').then(r => setShops(r.data)).catch(() => setShops([]));
  }, []);
  return <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>{shops.map(shop => <Text key={shop.id}>{shop.name} - {shop.location}</Text>)}</ScrollView>;
};
