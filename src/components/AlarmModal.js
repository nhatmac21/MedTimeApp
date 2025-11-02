import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { playAlarmSound, stopAlarmSound } from '../services/alarmService';

const { width } = Dimensions.get('window');

export default function AlarmModal({ visible, medication, onDismiss }) {
  const [pulseAnim] = useState(new Animated.Value(1));
  const animationRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (visible && medication && !isPlayingRef.current) {
      console.log('AlarmModal: Starting alarm for', medication.name);
      isPlayingRef.current = true;
      
      // Play alarm sound
      playAlarmSound(medication.alarmSound || 'alarm1').catch(console.error);

      // Start pulse animation
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    }

    // Cleanup when modal closes
    if (!visible && isPlayingRef.current) {
      console.log('AlarmModal: Cleaning up alarm');
      if (animationRef.current) {
        animationRef.current.stop();
      }
      stopAlarmSound();
      isPlayingRef.current = false;
    }
  }, [visible, medication]);

  const handleDismiss = async () => {
    console.log('AlarmModal: User dismissed alarm');
    
    // Stop animation
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    
    // Stop alarm sound
    await stopAlarmSound();
    isPlayingRef.current = false;
    
    // Close modal and go back to HomeScreen
    onDismiss();
  };

  if (!visible || !medication) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Alarm Icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="alarm" size={80} color={Colors.primary} />
          </Animated.View>

          {/* Time */}
          <Text style={styles.timeText}>{medication.time}</Text>

          {/* Medication Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>Đến giờ uống thuốc!</Text>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <Text style={styles.dosage}>{medication.dosage}</Text>
            {medication.notes && (
              <Text style={styles.notes}>{medication.notes}</Text>
            )}
          </View>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.dismissButton]}
              onPress={handleDismiss}
            >
              <Ionicons name="close-circle" size={28} color={Colors.white} />
              <Text style={styles.buttonText}>Tắt báo thức</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(47, 167, 122, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  medicationName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  dosage: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  dismissButton: {
    backgroundColor: Colors.danger,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
