import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors } from '../theme/colors';

const ALARM_SOUNDS = [
  { id: 'alarm1', name: 'Chuông 1', file: require('../../assets/sounds/alarm1.mp3') },
  { id: 'alarm2', name: 'Chuông 2', file: require('../../assets/sounds/alarm2.mp3') },
  { id: 'alarm3', name: 'Chuông 3', file: require('../../assets/sounds/alarm3.mp3') },
  { id: 'alarm4', name: 'Chuông 4', file: require('../../assets/sounds/alarm4.mp3') },
  { id: 'alarm5', name: 'Chuông 5', file: require('../../assets/sounds/alarm5.mp3') },
  { id: 'alarm6', name: 'Chuông 6', file: require('../../assets/sounds/alarm6.mp3') },
  { id: 'alarm7', name: 'Chuông 7', file: require('../../assets/sounds/alarm7.mp3') },
  { id: 'alarm8', name: 'Chuông 8', file: require('../../assets/sounds/alarm8.mp3') },
  { id: 'alarm9', name: 'Chuông 9', file: require('../../assets/sounds/alarm9.mp3') },
  { id: 'alarm10', name: 'Chuông 10', file: require('../../assets/sounds/alarm10.mp3') },
  { id: 'alarm11', name: 'Chuông 11', file: require('../../assets/sounds/alarm11.mp3') },
  { id: 'alarm12', name: 'Chuông 12', file: require('../../assets/sounds/alarm12.mp3') },
];

export default function AlarmSoundPicker({ selectedSound, onSoundSelect }) {
  const [showModal, setShowModal] = useState(false);
  const [playingSound, setPlayingSound] = useState(null);
  const [soundObject, setSoundObject] = useState(null);

  const playPreview = async (sound) => {
    try {
      // Stop current sound if playing
      if (soundObject) {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
      }

      // Play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        sound.file,
        { shouldPlay: true, volume: 0.5 }
      );
      
      setSoundObject(newSound);
      setPlayingSound(sound.id);

      // Stop after preview
      setTimeout(async () => {
        try {
          await newSound.stopAsync();
          await newSound.unloadAsync();
          setPlayingSound(null);
          setSoundObject(null);
        } catch (error) {
          console.log('Error stopping preview:', error);
        }
      }, 3000); // Play 3 seconds
    } catch (error) {
      console.error('Error playing sound preview:', error);
    }
  };

  const stopPreview = async () => {
    if (soundObject) {
      try {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        setSoundObject(null);
        setPlayingSound(null);
      } catch (error) {
        console.log('Error stopping sound:', error);
      }
    }
  };

  const handleSoundSelect = async (sound) => {
    await stopPreview();
    onSoundSelect(sound);
    setShowModal(false);
  };

  const getSelectedSoundName = () => {
    const sound = ALARM_SOUNDS.find(s => s.id === selectedSound);
    return sound ? sound.name : 'Chọn nhạc chuông';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nhạc chuông nhắc nhở</Text>
      
      <TouchableOpacity 
        style={styles.pickerButton} 
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="musical-notes" size={20} color={Colors.primary} />
        <Text style={[styles.pickerText, !selectedSound && styles.placeholder]}>
          {getSelectedSoundName()}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          stopPreview();
          setShowModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn nhạc chuông</Text>
              <TouchableOpacity 
                onPress={() => {
                  stopPreview();
                  setShowModal(false);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.soundList}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
            >
              {ALARM_SOUNDS.map((sound) => (
                <View key={sound.id} style={styles.soundItem}>
                  <TouchableOpacity
                    style={[
                      styles.soundOption,
                      selectedSound === sound.id && styles.selectedSound
                    ]}
                    onPress={() => handleSoundSelect(sound)}
                  >
                    <Ionicons 
                      name={selectedSound === sound.id ? "checkmark-circle" : "musical-note-outline"} 
                      size={24} 
                      color={selectedSound === sound.id ? Colors.primary : Colors.textMuted} 
                    />
                    <Text style={[
                      styles.soundName,
                      selectedSound === sound.id && styles.selectedSoundText
                    ]}>
                      {sound.name}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => {
                      if (playingSound === sound.id) {
                        stopPreview();
                      } else {
                        playPreview(sound);
                      }
                    }}
                  >
                    <Ionicons 
                      name={playingSound === sound.id ? "stop-circle" : "play-circle"} 
                      size={32} 
                      color={playingSound === sound.id ? Colors.danger : Colors.primary} 
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '70%', // Giới hạn chiều cao tối đa 70% màn hình
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  soundList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  soundOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedSound: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(47, 167, 122, 0.1)',
  },
  soundName: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  selectedSoundText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  playButton: {
    padding: 4,
  },
});

export { ALARM_SOUNDS };
