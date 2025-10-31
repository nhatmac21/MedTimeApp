import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { Colors } from './src/theme/colors';
import { isLoggedIn } from './src/services/auth';
import { showPushNotificationWarning } from './src/utils/pushNotificationUtils';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
    
    // Check and show warning if push notifications aren't available
    showPushNotificationWarning();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const loggedIn = await isLoggedIn();
      setIsAuthenticated(loggedIn);
    } catch (error) {
      console.log('Error checking login status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login success
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        {isAuthenticated ? (
          <MainNavigator onLogout={handleLogout} />
        ) : (
          <AuthNavigator onLoginSuccess={handleLoginSuccess} />
        )}
      </View>
    </NavigationContainer>
  );
}
