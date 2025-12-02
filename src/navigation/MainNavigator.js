import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RootNavigator from './RootNavigator';
import PremiumScreen from '../screens/PremiumScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import GuardianEditorScreen from '../screens/GuardianEditorScreen';
import EditorStackNavigator from './EditorStackNavigator';

const Stack = createStackNavigator();

export default function MainNavigator({ onLogout }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main">
        {() => <RootNavigator onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen 
        name="Premium" 
        component={PremiumScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="PaymentHistory" 
        component={PaymentHistoryScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="PatientDetail" 
        component={PatientDetailScreen}
      />
      <Stack.Screen 
        name="GuardianEditor" 
        component={GuardianEditorScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Editor" 
        component={EditorStackNavigator}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}