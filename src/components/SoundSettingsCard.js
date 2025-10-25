import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getSoundSettings } from '../services/alarmService';

export default function SoundSettingsCard() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSoundSettings();
  }, []);

  const loadSoundSettings = async () => {
    try {
      const { enabled } = await getSoundSettings();
      setSoundEnabled(enabled);
    } catch (error) {
      console.log('Error loading sound settings:', error);
    }
  };

  const handleToggleSound = async (value) => {
    setLoading(true);
    try {
      const { toggleSound } = await getSoundSettings();
      await toggleSound(value);
      setSoundEnabled(value);
    } catch (error) {
      console.log('Error toggling sound:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={soundEnabled ? "volume-high" : "volume-mute"} 
            size={24} 
            color={soundEnabled ? Colors.primary : Colors.textMuted} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Âm thanh nhắc nhở</Text>
          <Text style={styles.description}>
            {soundEnabled ? 'Phát âm thanh khi đến giờ uống thuốc' : 'Chỉ hiển thị thông báo im lặng'}
          </Text>
        </View>
        <Switch
          value={soundEnabled}
          onValueChange={handleToggleSound}
          disabled={loading}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={soundEnabled ? Colors.primary : Colors.textMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});