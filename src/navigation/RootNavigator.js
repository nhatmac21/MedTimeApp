import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import EditorStackNavigator from './EditorStackNavigator';
import SearchScreen from '../screens/SearchScreen';
import CaregiverScreen from '../screens/CaregiverScreen';
import { Colors } from '../theme/colors';
import { requestPermissions } from '../services/notifications';

const Tab = createBottomTabNavigator();

export default function RootNavigator({ onLogout }) {
  useEffect(() => { requestPermissions(); }, []);
  return (
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
              'Giám hộ': focused ? 'people' : 'people-outline',
            };
            const name = map[route.name] ?? 'ellipse';
            return <Ionicons name={name} color={color} size={22} />;
          },
        })}
      >
        <Tab.Screen 
          name="Trang chủ" 
          children={(props) => <HomeScreen {...props} onLogout={onLogout} />} 
        />
        <Tab.Screen name="Thêm" component={EditorStackNavigator} />
        <Tab.Screen name="Tìm" component={SearchScreen} />
        <Tab.Screen 
          name="Giám hộ" 
          children={({ navigation }) => <CaregiverScreen onLogout={onLogout} navigation={navigation} />} 
        />
      </Tab.Navigator>
  );
}
