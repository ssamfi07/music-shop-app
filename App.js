import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ContactUsScreen from './screens/ContactUsScreen';
import AddProductScreen from './screens/AddProductScreen';
import ProductsScreen from './screens/ProductsScreen';
import ProductScreen from './screens/ProductScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import OwnedScreen from './screens/OwnedScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>

        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ContactUs" component={ContactUsScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="Product" component={ProductScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Owned" component={OwnedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
