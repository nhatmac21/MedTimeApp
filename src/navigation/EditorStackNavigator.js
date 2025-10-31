import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EditorScreen from '../screens/EditorScreen';
import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen';

const Stack = createStackNavigator();

export default function EditorStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="EditorMain" component={EditorScreen} />
      <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
    </Stack.Navigator>
  );
}