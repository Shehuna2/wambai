import React, { useEffect, useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { api } from '../../api/client';

export const MyShopScreen = () => {
  const [shop, setShop] = useState<any>(null);
  const [form, setForm] = useState({ name: '', location: '', description: '', logo_url: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    api
      .get('/vendor/shop/')
      .then(({ data }) => {
        setShop(data);
        setForm({
          name: data?.name ?? '',
          location: data?.location ?? '',
          description: data?.description ?? '',
          logo_url: data?.logo_url ?? '',
        });
      })
      .catch(() => setShop(null));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: form.name,
        location: form.location,
        description: form.description,
        logo_url: form.logo_url,
      };
      const { data } = await api[shop ? 'patch' : 'post']('/vendor/shop/', payload);
      setShop(data);
      setMessage(shop ? 'Shop updated.' : 'Shop created. Pending approval.');
    } catch (err: any) {
      setMessage(err?.response?.data?.detail ?? 'Unable to save shop.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>My Shop</Text>
      {shop ? (
        <Text>
          Status: {shop.is_approved ? 'Approved' : 'Pending approval'}
        </Text>
      ) : (
        <Text>No shop yet.</Text>
      )}
      <TextInput placeholder="Shop name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} style={{ borderWidth: 1, padding: 8 }} />
      <TextInput placeholder="Location" value={form.location} onChangeText={(location) => setForm({ ...form, location })} style={{ borderWidth: 1, padding: 8 }} />
      <TextInput placeholder="Description" value={form.description} onChangeText={(description) => setForm({ ...form, description })} style={{ borderWidth: 1, padding: 8 }} />
      <TextInput placeholder="Logo URL" value={form.logo_url} onChangeText={(logo_url) => setForm({ ...form, logo_url })} style={{ borderWidth: 1, padding: 8 }} />
      <Button title={saving ? 'Saving...' : shop ? 'Update shop' : 'Create shop'} onPress={submit} disabled={saving} />
      {!!message && <Text>{message}</Text>}
    </View>
  );
};
