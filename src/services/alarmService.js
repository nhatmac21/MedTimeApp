import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = '@medtime_sound_enabled';

let currentSound = null;

// Initialize audio settings
export const initializeAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.log('Error initializing audio:', error);
  }
};

// Check if sound is enabled
export const isSoundEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    return enabled === null ? true : enabled === 'true'; // Default to enabled
  } catch (error) {
    return true;
  }
};

// Set sound enabled/disabled
export const setSoundEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.log('Error setting sound preference:', error);
  }
};

// Play medication alarm sound
export const playMedicationAlarm = async () => {
  try {
    const soundEnabled = await isSoundEnabled();
    if (!soundEnabled) return;

    // Stop current sound if playing
    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    // Load and play new sound
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/alarm1.mp3'),
      {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      }
    );
    
    currentSound = sound;
    
    // Auto stop after 30 seconds if still playing
    setTimeout(() => {
      stopMedicationAlarm();
    }, 30000);

    return sound;
  } catch (error) {
    console.log('Error playing medication alarm:', error);
    return null;
  }
};

// Stop medication alarm
export const stopMedicationAlarm = async () => {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch (error) {
    console.log('Error stopping medication alarm:', error);
  }
};

// Show medication alert popup with sound control
export const showMedicationAlert = async (medicationName, time) => {
  const soundEnabled = await isSoundEnabled();
  
  // Play alarm sound
  if (soundEnabled) {
    await playMedicationAlarm();
  }

  return new Promise((resolve) => {
    Alert.alert(
      '💊 Nhắc nhở uống thuốc',
      `Đã đến giờ uống ${medicationName} lúc ${time}`,
      [
        {
          text: 'Tắt âm thanh',
          style: 'destructive',
          onPress: async () => {
            await stopMedicationAlarm();
            await setSoundEnabled(false);
            resolve('sound_disabled');
          }
        },
        {
          text: 'Tạm hoãn',
          onPress: async () => {
            await stopMedicationAlarm();
            // Schedule snooze (5 minutes later)
            setTimeout(() => {
              showMedicationAlert(medicationName, time);
            }, 5 * 60 * 1000); // 5 minutes
            resolve('snoozed');
          }
        },
        {
          text: 'Đã uống',
          onPress: async () => {
            await stopMedicationAlarm();
            resolve('taken');
          }
        }
      ],
      { 
        cancelable: false,
        onDismiss: async () => {
          await stopMedicationAlarm();
          resolve('dismissed');
        }
      }
    );
  });
};

// Check if current time matches any medication schedule
export const checkMedicationSchedule = async () => {
  try {
    // Import here to avoid circular dependency
    const { fetchMedicationsForDate } = require('./medicationsApi');
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toDateString();
    const today = now.toISOString().split('T')[0];

    // Get today's medications
    const medications = await fetchMedicationsForDate(today);

    for (const medication of medications) {
      if (medication.times && medication.times.includes(currentTime)) {
        // Check if already notified today for this time
        const notificationKey = `@medtime_notified_${medication.name}_${currentTime}_${currentDate}`;
        const alreadyNotified = await AsyncStorage.getItem(notificationKey);
        
        if (!alreadyNotified) {
          // Mark as notified
          await AsyncStorage.setItem(notificationKey, 'true');
          
          // Show alert
          const result = await showMedicationAlert(medication.name, currentTime);
          
          // Log the result for analytics
          console.log(`Medication alert result for ${medication.name}: ${result}`);
        }
      }
    }
  } catch (error) {
    console.log('Error checking medication schedule:', error);
  }
};

// Start medication monitoring (call this in your app)
export const startMedicationMonitoring = () => {
  // Check every minute
  const interval = setInterval(() => {
    checkMedicationSchedule();
  }, 60000); // 60 seconds

  // Check immediately once
  checkMedicationSchedule();

  return interval;
};

// Stop medication monitoring
export const stopMedicationMonitoring = (interval) => {
  if (interval) {
    clearInterval(interval);
  }
};

// Get sound setting for UI display
export const getSoundSettings = async () => {
  const enabled = await isSoundEnabled();
  return {
    enabled,
    toggleSound: setSoundEnabled,
  };
};