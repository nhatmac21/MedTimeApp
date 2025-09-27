import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Platform, 
  FlatList 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import dayjs from 'dayjs';

export default function TimePicker({ label, value, onTimeChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(value ? parseInt(value.split(':')[0]) : 8);
  const [selectedMinute, setSelectedMinute] = useState(value ? parseInt(value.split(':')[1]) : 0);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0, 1, 2, ..., 59

  const formatTime = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  const handleConfirm = () => {
    const time = formatTime(selectedHour, selectedMinute);
    onTimeChange(time);
    setShowPicker(false);
  };

  const displayTime = value || 'Chọn giờ';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker(true)}>
        <Text style={[styles.timeText, !value && styles.placeholder]}>{displayTime}</Text>
        <Ionicons name="time-outline" size={20} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Chọn giờ nhắc</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.confirmText}>Xong</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.wheelContainer}>
              <View style={styles.wheel}>
                <Text style={styles.wheelLabel}>Giờ</Text>
                <FlatList
                  style={styles.wheelOptions}
                  data={hours}
                  keyExtractor={(item) => item.toString()}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: h }) => (
                    <TouchableOpacity 
                      style={[styles.wheelOption, selectedHour === h && styles.selectedWheelOption]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <Text style={[styles.wheelOptionText, selectedHour === h && styles.selectedWheelText]}>
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              
              <View style={styles.wheel}>
                <Text style={styles.wheelLabel}>Phút</Text>
                <FlatList
                  style={styles.wheelOptions}
                  data={minutes}
                  keyExtractor={(item) => item.toString()}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: m }) => (
                    <TouchableOpacity 
                      style={[styles.wheelOption, selectedMinute === m && styles.selectedWheelOption]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <Text style={[styles.wheelOptionText, selectedMinute === m && styles.selectedWheelText]}>
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
            
            <View style={styles.preview}>
              <Text style={styles.previewText}>
                Thời gian: {formatTime(selectedHour, selectedMinute)}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  placeholder: { color: Colors.textMuted },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  pickerContainer: { 
    backgroundColor: Colors.card, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    paddingBottom: 40 
  },
  pickerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border 
  },
  cancelText: { color: Colors.textMuted, fontSize: 16 },
  pickerTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  confirmText: { color: Colors.primaryDark, fontSize: 16, fontWeight: '600' },
  wheelContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20 },
  wheel: { flex: 1, marginHorizontal: 10 },
  wheelLabel: { textAlign: 'center', fontSize: 14, color: Colors.textMuted, marginBottom: 10 },
  wheelOptions: { maxHeight: 200, paddingVertical: 10 },
  wheelOption: { 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderRadius: 8, 
    marginVertical: 2 
  },
  selectedWheelOption: { backgroundColor: Colors.primaryDark },
  wheelOptionText: { fontSize: 18, color: Colors.textPrimary },
  selectedWheelText: { color: Colors.white, fontWeight: '600' },
  preview: { 
    padding: 20, 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: Colors.border, 
    marginTop: 20 
  },
  previewText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
});