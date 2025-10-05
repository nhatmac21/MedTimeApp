import React, { useState } from 'react';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

export default function AuthNavigator({ onLoginSuccess }) {
  const [currentScreen, setCurrentScreen] = useState('Login');

  const navigation = {
    navigate: (screenName) => {
      setCurrentScreen(screenName);
    }
  };

  if (currentScreen === 'Register') {
    return <RegisterScreen navigation={navigation} />;
  }

  return <LoginScreen navigation={navigation} onLoginSuccess={onLoginSuccess} />;
}