import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const REPEAT_PATTERNS = [
  { 
    id: 'DAILY', 
    name: 'Hằng ngày',
    icon: 'calendar',
    description: 'Nhắc mỗi ngày'
  },
  { 
    id: 'EVERY_X_DAYS', 
    name: 'Mỗi X ngày',
    icon: 'repeat',
    description: 'Nhắc mỗi X ngày một lần',
    needsInterval: true
  },
  { 
    id: 'WEEKLY', 
    name: 'Hằng tuần',
    icon: 'calendar-outline',
    description: 'Nhắc theo tuần',
    needsDayOfWeek: true
  },
  { 
    id: 'MONTHLY', 
    name: 'Hằng tháng',
    icon: 'calendar-number',
    description: 'Nhắc theo tháng',
    needsDayOfMonth: true
  },
];

const DAYS_OF_WEEK = [
  { id: 'MON', name: 'T2' },
  { id: 'TUE', name: 'T3' },
  { id: 'WED', name: 'T4' },
  { id: 'THU', name: 'T5' },
  { id: 'FRI', name: 'T6' },
  { id: 'SAT', name: 'T7' },
  { id: 'SUN', name: 'CN' },
];

export default function RepeatPatternPicker({ 
  selectedPattern, 
  interval,
  dayOfWeek,
  dayOfMonth,
  onPatternChange 
}) {
  const [showModal, setShowModal] = useState(false);
  const [tempPattern, setTempPattern] = useState(selectedPattern || 'DAILY');
  const [tempInterval, setTempInterval] = useState(interval || 2);
  const [tempDayOfWeek, setTempDayOfWeek] = useState(dayOfWeek || 'MON');
  const [tempDayOfMonth, setTempDayOfMonth] = useState(dayOfMonth || 1);

  const getPatternDisplay = () => {
    const pattern = REPEAT_PATTERNS.find(p => p.id === selectedPattern);
    if (!pattern) return 'Chọn tần suất nhắc';
    
    let display = pattern.name;
    
    if (selectedPattern === 'EVERY_X_DAYS' && interval) {
      display = `Mỗi ${interval} ngày`;
    } else if (selectedPattern === 'WEEKLY' && dayOfWeek) {
      const day = DAYS_OF_WEEK.find(d => d.id === dayOfWeek);
      display = `Hằng tuần (${day?.name || 'T2'})`;
    } else if (selectedPattern === 'MONTHLY' && dayOfMonth) {
      display = `Hằng tháng (Ngày ${dayOfMonth})`;
    }
    
    return display;
  };

  const handleConfirm = () => {
    const result = {
      pattern: tempPattern,
      interval: tempPattern === 'EVERY_X_DAYS' ? tempInterval : 1,
      dayOfWeek: tempPattern === 'WEEKLY' ? tempDayOfWeek : null,
      dayOfMonth: tempPattern === 'MONTHLY' ? tempDayOfMonth : null,
    };
    
    onPatternChange(result);
    setShowModal(false);
  };

  const selectedPatternObj = REPEAT_PATTERNS.find(p => p.id === tempPattern);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tần suất nhắc lại</Text>
      
      <TouchableOpacity 
        style={styles.pickerButton} 
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="repeat" size={20} color={Colors.primary} />
        <Text style={[styles.pickerText, !selectedPattern && styles.placeholder]}>
          {getPatternDisplay()}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn tần suất nhắc lại</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.patternList} showsVerticalScrollIndicator={false}>
              {REPEAT_PATTERNS.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.patternItem,
                    tempPattern === pattern.id && styles.selectedPattern
                  ]}
                  onPress={() => setTempPattern(pattern.id)}
                >
                  <Ionicons 
                    name={pattern.icon} 
                    size={24} 
                    color={tempPattern === pattern.id ? Colors.primary : Colors.textMuted} 
                  />
                  <View style={styles.patternInfo}>
                    <Text style={[
                      styles.patternName,
                      tempPattern === pattern.id && styles.selectedPatternText
                    ]}>
                      {pattern.name}
                    </Text>
                    <Text style={styles.patternDescription}>{pattern.description}</Text>
                  </View>
                  {tempPattern === pattern.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Additional Options */}
            {selectedPatternObj?.needsInterval && (
              <View style={styles.optionContainer}>
                <Text style={styles.optionLabel}>Số ngày:</Text>
                <TextInput
                  style={styles.optionInput}
                  value={String(tempInterval)}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 2;
                    setTempInterval(Math.max(2, Math.min(365, num)));
                  }}
                  keyboardType="numeric"
                  placeholder="2"
                />
              </View>
            )}

            {selectedPatternObj?.needsDayOfWeek && (
              <View style={styles.optionContainer}>
                <Text style={styles.optionLabel}>Chọn thứ:</Text>
                <View style={styles.dayOfWeekContainer}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.dayChip,
                        tempDayOfWeek === day.id && styles.selectedDayChip
                      ]}
                      onPress={() => setTempDayOfWeek(day.id)}
                    >
                      <Text style={[
                        styles.dayChipText,
                        tempDayOfWeek === day.id && styles.selectedDayChipText
                      ]}>
                        {day.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {selectedPatternObj?.needsDayOfMonth && (
              <View style={styles.optionContainer}>
                <Text style={styles.optionLabel}>Ngày trong tháng:</Text>
                <TextInput
                  style={styles.optionInput}
                  value={String(tempDayOfMonth)}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 1;
                    setTempDayOfMonth(Math.max(1, Math.min(31, num)));
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
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
    maxHeight: '80%',
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
  patternList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedPattern: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(47, 167, 122, 0.1)',
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  selectedPatternText: {
    color: Colors.primary,
  },
  patternDescription: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  optionContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  optionInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayOfWeekContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 50,
    alignItems: 'center',
  },
  selectedDayChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  selectedDayChipText: {
    color: Colors.white,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
