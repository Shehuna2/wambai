import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ModeSwitch } from '../components/ModeSwitch';
import { useAuth } from '../context/AuthContext';
import { BuyerHomeScreen } from '../screens/buyer/HomeScreen';
import { BuyerShopsScreen } from '../screens/buyer/ShopsScreen';
import { CartScreen } from '../screens/buyer/CartScreen';
import { WalletScreen } from '../screens/buyer/WalletScreen';
import { CheckoutScreen } from '../screens/buyer/CheckoutScreen';
import { MyShopScreen } from '../screens/vendor/MyShopScreen';
import { MyProductsScreen } from '../screens/vendor/MyProductsScreen';
import { VendorOrdersScreen } from '../screens/vendor/VendorOrdersScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  const { mode } = useAuth();

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerRight: () => <ModeSwitch /> }}>
        {mode === 'BUYER' ? (
          <>
            <Tab.Screen name="Home" component={BuyerHomeScreen} />
            <Tab.Screen name="Shops" component={BuyerShopsScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="Wallet" component={WalletScreen} />
            <Tab.Screen name="Checkout" component={CheckoutScreen} />
          </>
        ) : (
          <>
            <Tab.Screen name="MyShop" component={MyShopScreen} />
            <Tab.Screen name="Products" component={MyProductsScreen} />
            <Tab.Screen name="Orders" component={VendorOrdersScreen} />
          </>
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
};
