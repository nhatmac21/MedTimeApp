import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { Colors } from './src/theme/colors';
import { isLoggedIn, refreshAccessToken } from './src/services/auth';
import { initializeAudio, startMedicationMonitoring, stopMedicationMonitoring } from './src/services/alarmService';
import { fetchMedicationsForDate } from './src/services/medicationsApi';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const monitoringInterval = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    initializeApp();
    
    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      if (monitoringInterval.current) {
        stopMedicationMonitoring(monitoringInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  }, [isAuthenticated]);

  const initializeApp = async () => {
    try {
      // Initialize audio system
      await initializeAudio();
      
      // Check login status
      const loggedIn = await isLoggedIn();
      
      if (loggedIn) {
        // Try to refresh access token if logged in
        console.log('🔄 Attempting to refresh access token...');
        const refreshResult = await refreshAccessToken();
        
        if (refreshResult.success) {
          console.log('✅ Access token refreshed successfully');
          setIsAuthenticated(true);
        } else {
          console.log('❌ Failed to refresh token:', refreshResult.error);
          // If refresh fails, user needs to login again
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('Error initializing app:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppStateChange = (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground, restart monitoring if authenticated
      if (isAuthenticated) {
        startMonitoring();
      }
    }
    appState.current = nextAppState;
  };

  const startMonitoring = async () => {
    try {
      // Stop existing monitoring
      stopMonitoring();
      
      // Start medication monitoring
      monitoringInterval.current = startMedicationMonitoring();
      console.log('Started medication monitoring');
    } catch (error) {
      console.log('Error starting medication monitoring:', error);
    }
  };

  const stopMonitoring = () => {
    if (monitoringInterval.current) {
      stopMedicationMonitoring(monitoringInterval.current);
      monitoringInterval.current = null;
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
