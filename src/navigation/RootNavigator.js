import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import EditorScreen from '../screens/EditorScreen';
import SearchScreen from '../screens/SearchScreen';
import CommunityScreen from '../screens/CommunityScreen';
import { Colors } from '../theme/colors';
import { requestPermissions } from '../services/notifications';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.surface },
};

export default function RootNavigator() {
  useEffect(() => { requestPermissions(); }, []);
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: Colors.white,
          tabBarInactiveTintColor: '#d0eef2',
          tabBarStyle: { backgroundColor: Colors.primaryDark, borderTopWidth: 0, height: 72, paddingBottom: 12, paddingTop: 10 },
          tabBarLabelStyle: { fontSize: 12 },
          tabBarIcon: ({ color, size, focused }) => {
            const map = {
              'Trang chủ': focused ? 'home' : 'home-outline',
              'Thêm': focused ? 'create' : 'create-outline',
              'Tìm': focused ? 'search' : 'search-outline',
              'Khác': focused ? 'people' : 'people-outline',
            };
            const name = map[route.name] ?? 'ellipse';
            return <Ionicons name={name} color={color} size={22} />;
          },
        })}
      >
        <Tab.Screen name="Trang chủ" component={HomeScreen} />
        <Tab.Screen name="Thêm" component={EditorScreen} />
        <Tab.Screen name="Tìm" component={SearchScreen} />
        <Tab.Screen name="Khác" component={CommunityScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
