import React, { useEffect, useState } from 'react';
import { Button, ScrollView, Text, TextInput, View } from 'react-native';

import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Product, Shop } from '../../types';

const categories = [
  { label: 'All', value: '' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Wool', value: 'wool' },
  { label: 'Fabric', value: 'fabric' },
  { label: 'Other', value: 'other' },
];
const sorts = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price low-high', value: 'price_asc' },
  { label: 'Price high-low', value: 'price_desc' },
];

export const BuyerHomeScreen = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/shops/').then(r => setShops(r.data)).catch(() => setShops([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError('');
      api.get('/products/', {
        params: {
          ...(search ? { search } : {}),
          ...(category ? { category } : {}),
        },
      })
        .then(r => setProducts(r.data))
        .catch(() => {
          setProducts([]);
          setError('Unable to load products');
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category]);

  const sortedProducts = [...products].sort((a, b) => {
    if (sort === 'price_asc') return a.price_cents - b.price_cents;
    if (sort === 'price_desc') return b.price_cents - a.price_cents;
    return b.id - a.id;
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Welcome {user?.email ?? 'Buyer'}</Text>
        <Text>Default currency: {user?.profile?.default_currency ?? 'NGN'}</Text>
      </View>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Product filters</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products"
          style={{ borderWidth: 1, padding: 8, marginTop: 8 }}
        />
        <View style={{ marginTop: 8, gap: 8 }}>
          {categories.map(option => (
            <Button
              key={option.value || 'all'}
              title={option.label + (category === option.value ? ' ✓' : '')}
              onPress={() => setCategory(option.value)}
            />
          ))}
        </View>
        <View style={{ marginTop: 8, gap: 8 }}>
          {sorts.map(option => (
            <Button
              key={option.value}
              title={option.label + (sort === option.value ? ' ✓' : '')}
              onPress={() => setSort(option.value as 'newest' | 'price_asc' | 'price_desc')}
            />
          ))}
        </View>
        <View style={{ marginTop: 8 }}>
          <Button
            title="Clear filters"
            onPress={() => {
              setSearch('');
              setCategory('');
              setSort('newest');
            }}
          />
        </View>
      </View>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Featured Shops</Text>
        {shops.slice(0, 5).map(shop => <Text key={shop.id}>• {shop.name}</Text>)}
      </View>
      <View>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Featured Products</Text>
        {!!error && <Text>{error}</Text>}
        {!error && !products.length && <Text>No products found.</Text>}
        {sortedProducts.slice(0, 8).map(product => <Text key={product.id}>• {product.title} ({product.price_cents / 100} {product.currency})</Text>)}
      </View>
    </ScrollView>
  );
};
