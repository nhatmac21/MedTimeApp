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
import { Colors } from '../theme/colors';

export default function DateOfBirthPicker({ value, onDateChange }) {
  const [showModal, setShowModal] = useState(false);
  
  // Parse current value or default to 1990-01-01
  const parseDate = (dateString) => {
    if (!dateString) return { day: 1, month: 1, year: 1990 };
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear()
    };
  };
  
  const currentDate = parseDate(value);
  const [selectedDay, setSelectedDay] = useState(currentDate.day);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
  const [selectedYear, setSelectedYear] = useState(currentDate.year);

  // Generate arrays
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Chọn ngày sinh';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleConfirm = () => {
    const day = String(selectedDay).padStart(2, '0');
    const month = String(selectedMonth).padStart(2, '0');
    const dateString = `${selectedYear}-${month}-${day}`;
    onDateChange(dateString);
    setShowModal(false);
  };

  const openModal = () => {
    // Reset to current value when opening
    const current = parseDate(value);
    setSelectedDay(current.day);
    setSelectedMonth(current.month);
    setSelectedYear(current.year);
    setShowModal(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.inputButton} onPress={openModal}>
        <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {formatDisplayDate(value)}
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
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chọn ngày sinh</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Selected Date Display */}
            <View style={styles.selectedDateDisplay}>
              <Text style={styles.selectedDateText}>
                {`${String(selectedDay).padStart(2, '0')}/${String(selectedMonth).padStart(2, '0')}/${selectedYear}`}
              </Text>
            </View>

            {/* Picker Container */}
            <View style={styles.pickerContainer}>
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Ngày</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  style={styles.scrollPicker}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDay === day && styles.selectedPickerItemText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Tháng</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  style={styles.scrollPicker}
                >
                  {months.map((month) => (
                    <TouchableOpacity
                      key={month.value}
                      style={[
                        styles.pickerItem,
                        selectedMonth === month.value && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedMonth(month.value)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMonth === month.value && styles.selectedPickerItemText
                      ]}>
                        {month.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Năm</Text>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  style={styles.scrollPicker}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.selectedPickerItem
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.selectedPickerItemText
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

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
    flex: 1,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primaryDark,
    textAlign: 'right',
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
    maxHeight: '70%',
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
  selectedDateDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 300,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollPicker: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: Colors.primary,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  selectedPickerItemText: {
    color: Colors.white,
    fontWeight: '700',
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
