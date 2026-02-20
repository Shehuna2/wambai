import React, { useEffect, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import { api } from '../../api/client';

type GroupedCartItem = {
  id: number;
  qty: string;
  product: {
    title: string;
    qty_step?: string;
  };
};

const SCALE = 1000n;

const toMilliUnits = (value: string) => {
  const [wholePart = '0', decimalPart = ''] = value.trim().split('.');
  const normalizedDecimals = (decimalPart + '000').slice(0, 3);
  const sign = wholePart.startsWith('-') ? -1n : 1n;
  const whole = BigInt(wholePart || '0');
  const decimals = BigInt(normalizedDecimals || '0');
  return sign * ((whole < 0 ? -whole : whole) * SCALE + decimals);
};

const fromMilliUnits = (value: bigint) => {
  const sign = value < 0n ? '-' : '';
  const abs = value < 0n ? -value : value;
  const whole = abs / SCALE;
  const decimals = (abs % SCALE).toString().padStart(3, '0').replace(/0+$/, '');
  return decimals ? `${sign}${whole.toString()}.${decimals}` : `${sign}${whole.toString()}`;
};

export const CartScreen = () => {
  const [grouped, setGrouped] = useState<Record<string, { shop: { id: number; name: string }; items: GroupedCartItem[] }>>({});

  const load = () => api.get('/cart/').then(r => setGrouped(r.data.grouped_by_shop ?? {}));

  const updateQty = async (item: GroupedCartItem, direction: 1 | -1) => {
    const step = item.product.qty_step ?? '1';
    const next = toMilliUnits(item.qty) + BigInt(direction) * toMilliUnits(step);
    if (next <= 0n) return;
    await api.patch(`/cart/items/${item.id}/`, { qty: fromMilliUnits(next) });
    await load();
  };

  useEffect(() => {
    load().catch(() => setGrouped({}));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {Object.values(grouped).map(group => (
        <View key={group.shop.id} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: '700' }}>{group.shop.name}</Text>
          {group.items.map(item => (
            <View key={item.id} style={{ marginTop: 8 }}>
              <Text>{item.product.title} x {item.qty}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title={`-${item.product.qty_step ?? '1'}`} onPress={() => updateQty(item, -1)} />
                <Button title={`+${item.product.qty_step ?? '1'}`} onPress={() => updateQty(item, 1)} />
              </View>
            </View>
          ))}
        </View>
      ))}
      <Button title="Refresh cart" onPress={() => load()} />
    </ScrollView>
  );
};
