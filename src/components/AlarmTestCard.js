import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { showMedicationAlert, playMedicationAlarm, stopMedicationAlarm } from '../services/alarmService';

export default function AlarmTestCard() {
  const testAlarm = async () => {
    try {
      await showMedicationAlert('Paracetamol', '14:30');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể phát âm thanh test');
    }
  };

  const testSoundOnly = async () => {
    try {
      await playMedicationAlarm();
      
      // Auto stop after 5 seconds for testing
      setTimeout(() => {
        stopMedicationAlarm();
      }, 5000);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể phát âm thanh test');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="musical-notes" size={24} color={Colors.primary} />
        <Text style={styles.title}>Test âm thanh nhắc nhở</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.testButton} onPress={testSoundOnly}>
          <Ionicons name="volume-high" size={20} color={Colors.white} />
          <Text style={styles.buttonText}>Test âm thanh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.testButton, styles.secondaryButton]} onPress={testAlarm}>
          <Ionicons name="notifications" size={20} color={Colors.primary} />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Test thông báo đầy đủ</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.description}>
        Dùng để kiểm tra âm thanh và thông báo nhắc nhở uống thuốc
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  testButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: Colors.primaryLight,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  description: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});