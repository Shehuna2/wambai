import React, { useEffect, useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';
import { api } from '../../api/client';

const toDecimalString = (value: number) => value.toFixed(3).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');

export const CartScreen = () => {
  const [grouped, setGrouped] = useState<Record<string, any>>({});

  const load = () => api.get('/cart/').then(r => setGrouped(r.data.grouped_by_shop ?? {}));

  const updateQty = async (item: any, direction: 1 | -1) => {
    const step = Number(item.product.qty_step ?? 1);
    const next = Math.max(0, Number(item.qty) + direction * step);
    await api.patch(`/cart/items/${item.id}/`, { qty: toDecimalString(next) });
    await load();
  };

  useEffect(() => {
    load().catch(() => setGrouped({}));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {Object.values(grouped).map((group: any) => (
        <View key={group.shop.id} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: '700' }}>{group.shop.name}</Text>
          {group.items.map((item: any) => (
            <View key={item.id} style={{ marginTop: 8 }}>
              <Text>{item.product.title} x {item.qty}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title={`-${item.product.qty_step ?? 1}`} onPress={() => updateQty(item, -1)} />
                <Button title={`+${item.product.qty_step ?? 1}`} onPress={() => updateQty(item, 1)} />
              </View>
            </View>
          ))}
        </View>
      ))}
      <Button title="Refresh cart" onPress={() => load()} />
    </ScrollView>
  );
};
