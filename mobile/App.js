import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Switch, Text, View } from "react-native";

export default function App() {
  const [isVendorMode, setVendorMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Wambai Marketplace</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.label}>Buyer</Text>
        <Switch value={isVendorMode} onValueChange={setVendorMode} />
        <Text style={styles.label}>Vendor</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.modeText}>{isVendorMode ? "Vendor dashboard" : "Buyer marketplace"}</Text>
        <Text style={styles.description}>
          {isVendorMode
            ? "Manage your shop, products, and vendor orders in one app."
            : "Browse multi-vendor products, top up wallet, and checkout in NGN."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1117",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  label: {
    color: "#9ca3af",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#161b22",
    borderRadius: 14,
    padding: 20,
  },
  modeText: {
    color: "#58a6ff",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    color: "#d1d5db",
    fontSize: 15,
  },
});
