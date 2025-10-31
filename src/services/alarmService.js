import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = '@medtime_sound_enabled';
const ALARM_STORAGE_KEY = '@alarm_settings';

let currentAlarmSound = null;

const ALARM_SOUNDS = {
  alarm1: require('../../assets/sounds/alarm1.mp3'),
  alarm2: require('../../assets/sounds/alarm2.mp3'),
  alarm3: require('../../assets/sounds/alarm3.mp3'),
};

// Initialize audio settings
export const initializeAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    console.log('Audio system ready');
  } catch (error) {
    console.log('Error initializing audio:', error);
  }
};

// Save alarm settings to storage
export const saveAlarmSettings = async (medicationId, alarmSoundId) => {
  try {
    const settings = await getAlarmSettings();
    settings[medicationId] = alarmSoundId;
    await AsyncStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(settings));
    console.log(`Saved alarm sound ${alarmSoundId} for medication ${medicationId}`);
  } catch (error) {
    console.error('Error saving alarm settings:', error);
  }
};

// Get all alarm settings
export const getAlarmSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(ALARM_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading alarm settings:', error);
    return {};
  }
};

// Get alarm sound for specific medication
export const getAlarmSoundForMedication = async (medicationId) => {
  try {
    const settings = await getAlarmSettings();
    return settings[medicationId] || 'alarm1'; // Default to alarm1
  } catch (error) {
    console.error('Error getting alarm sound:', error);
    return 'alarm1';
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

// Play alarm sound
export const playAlarmSound = async (alarmSoundId = 'alarm1') => {
  try {
    const soundEnabled = await isSoundEnabled();
    if (!soundEnabled) return;

    // Stop current sound if playing
    if (currentAlarmSound) {
      await stopAlarmSound();
    }

    // Configure audio mode for alarm
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    // Load and play sound
    const soundFile = ALARM_SOUNDS[alarmSoundId] || ALARM_SOUNDS.alarm1;
    const { sound } = await Audio.Sound.createAsync(
      soundFile,
      { 
        shouldPlay: true, 
        isLooping: true, // Loop the alarm
        volume: 1.0 
      }
    );

    currentAlarmSound = sound;
    console.log(`Playing alarm sound: ${alarmSoundId}`);
    
    return sound;
  } catch (error) {
    console.error('Error playing alarm sound:', error);
    throw error;
  }
};

// Stop alarm sound
export const stopAlarmSound = async () => {
  try {
    if (currentAlarmSound) {
      const soundToStop = currentAlarmSound;
      currentAlarmSound = null; // Clear reference first to prevent re-entry
      
      try {
        await soundToStop.stopAsync();
      } catch (e) {
        console.log('Error stopping sound:', e);
      }
      
      try {
        await soundToStop.unloadAsync();
      } catch (e) {
        console.log('Error unloading sound:', e);
      }
      
      console.log('Alarm sound stopped');
    }
  } catch (error) {
    console.error('Error stopping alarm sound:', error);
  }
};

// Check if alarm is playing
export const isAlarmPlaying = () => {
  return currentAlarmSound !== null;
};

// Play alarm with medication data
export const playAlarmForMedication = async (medicationId) => {
  try {
    const alarmSoundId = await getAlarmSoundForMedication(medicationId);
    await playAlarmSound(alarmSoundId);
  } catch (error) {
    console.error('Error playing alarm for medication:', error);
  }
};

// Legacy function for backward compatibility
export const playMedicationAlarm = async () => {
  try {
    await playAlarmSound('alarm1');
    currentPlayer = new AudioPlayer(require('../../assets/sounds/alarm1.mp3'));
    await currentPlayer.play({
      loop: true,
      volume: 1.0,
    });
    
    // Auto stop after 30 seconds if still playing
    setTimeout(() => {
      stopMedicationAlarm();
    }, 30000);

    return currentPlayer;
  } catch (error) {
    console.log('Error playing medication alarm:', error);
    return null;
  }
};

// Stop medication alarm
export const stopMedicationAlarm = async () => {
  try {
    if (currentPlayer) {
      await currentPlayer.stop();
      currentPlayer = null;
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