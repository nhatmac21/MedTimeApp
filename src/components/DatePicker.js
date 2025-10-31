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
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export default function DatePicker({ label, value, onDateChange, minDate }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? dayjs(value) : dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const monthsInVietnamese = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const getCalendarDays = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');

    const days = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }

    return days;
  };

  const isDateDisabled = (date) => {
    const today = dayjs().startOf('day');
    const compareDate = minDate ? dayjs(minDate).startOf('day') : today;
    return date.isBefore(compareDate);
  };

  const handleDateSelect = (date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
      onDateChange(date.format('YYYY-MM-DD'));
      setShowModal(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Chọn ngày';
    const date = dayjs(dateString);
    const dayOfWeek = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][date.day()];
    return `${dayOfWeek}, ${date.format('DD/MM/YYYY')}`;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity style={styles.inputButton} onPress={() => setShowModal(true)}>
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
              <Text style={styles.modalTitle}>Chọn ngày</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Selected Date Display */}
            <View style={styles.selectedDateDisplay}>
              <Text style={styles.selectedDateText}>
                {formatDisplayDate(selectedDate.format('YYYY-MM-DD'))}
              </Text>
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
                <Ionicons name="chevron-up" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              
              <Text style={styles.monthYearText}>
                {monthsInVietnamese[currentMonth.month()]} {currentMonth.year()}
              </Text>
              
              <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                <Ionicons name="chevron-down" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarContainer}>
              {/* Days of Week Header */}
              <View style={styles.daysOfWeekRow}>
                {daysOfWeek.map((day, index) => (
                  <View key={index} style={styles.dayOfWeekCell}>
                    <Text style={styles.dayOfWeekText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Days */}
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.calendarGrid}>
                  {getCalendarDays().map((day, index) => {
                    const isCurrentMonth = day.month() === currentMonth.month();
                    const isSelected = day.isSame(selectedDate, 'day');
                    const isToday = day.isSame(dayjs(), 'day');
                    const isDisabled = isDateDisabled(day);

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayCell,
                          isSelected && styles.selectedDayCell,
                          isToday && !isSelected && styles.todayCell
                        ]}
                        onPress={() => handleDateSelect(day)}
                        disabled={isDisabled}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            !isCurrentMonth && styles.otherMonthText,
                            isSelected && styles.selectedDayText,
                            isToday && !isSelected && styles.todayText,
                            isDisabled && styles.disabledDayText
                          ]}
                        >
                          {day.date()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
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
                onPress={() => {
                  if (selectedDate) {
                    onDateChange(selectedDate.format('YYYY-MM-DD'));
                  }
                  setShowModal(false);
                }}
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
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputButton: {
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
  inputText: {
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
    maxHeight: '85%',
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
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primaryDark,
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  calendarContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  selectedDayCell: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 50,
  },
  dayText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  otherMonthText: {
    color: Colors.textMuted,
    opacity: 0.4,
  },
  selectedDayText: {
    color: Colors.white,
    fontWeight: '700',
  },
  todayText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  disabledDayText: {
    color: Colors.textMuted,
    opacity: 0.3,
    textDecorationLine: 'line-through',
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
