import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import MedicationPicker from '../components/MedicationPicker';
import TimePicker from '../components/TimePicker';
import { addMedication } from '../services/storage';
import { scheduleReminder, buildDateFromTime } from '../services/notifications';
import dayjs from 'dayjs';

export default function EditorScreen({ navigation }) {
  const [selectedMed, setSelectedMed] = useState(null);
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [times, setTimes] = useState(['']);
  const [loading, setLoading] = useState(false);

  const addTimeSlot = () => {
    setTimes([...times, '']);
  };

  const updateTime = (index, time) => {
    const newTimes = [...times];
    newTimes[index] = time;
    setTimes(newTimes);
  };

  const removeTime = (index) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!selectedMed) {
      Alert.alert('Thông tin chưa đầy đủ', 'Vui lòng chọn loại thuốc từ danh sách');
      return false;
    }
    if (!dosage.trim()) {
      Alert.alert('Thông tin chưa đầy đủ', 'Vui lòng nhập liều lượng thuốc (ví dụ: 500mg)');
      return false;
    }
    if (!quantity.trim() || isNaN(parseInt(quantity)) || parseInt(quantity) < 1) {
      Alert.alert('Thông tin chưa đầy đủ', 'Vui lòng nhập số viên hợp lệ (ít nhất 1 viên)');
      return false;
    }
    const validTimes = times.filter(t => t.trim());
    if (validTimes.length === 0) {
      Alert.alert('Thông tin chưa đầy đủ', 'Vui lòng chọn ít nhất một mốc giờ nhắc nhở');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const validTimes = times.filter(t => t.trim());
      const medication = {
        name: selectedMed.name,
        dosage: dosage.trim(),
        times: validTimes.map(time => ({
          time,
          quantity: parseInt(quantity),
          status: 'pending'
        }))
      };

      const result = await addMedication(medication);
      if (result.success) {
        // Lên lịch thông báo cho từng mốc giờ
        for (const timeSlot of validTimes) {
          const today = dayjs();
          const notificationDate = buildDateFromTime(today.toDate(), timeSlot);
          
          // Chỉ đặt thông báo cho tương lai
          if (notificationDate.getTime() > Date.now()) {
            await scheduleReminder({
              title: `Nhắc uống: ${selectedMed.name}`,
              body: `${dosage.trim()}, uống ${quantity} viên lúc ${timeSlot}`,
              date: notificationDate,
            });
          }
        }

        Alert.alert(
          '✅ Thành công!', 
          `Đã thêm "${selectedMed.name}" với ${validTimes.length} mốc giờ nhắc nhở!`,
          [{ text: 'OK', onPress: () => resetForm() }]
        );
      } else {
        throw new Error(result.error || 'Không thể lưu thuốc');
      }
    } catch (error) {
      Alert.alert('⚠️ Có lỗi xảy ra', error.message || 'Không thể lưu thuốc. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMed(null);
    setDosage('');
    setQuantity('1');
    setTimes(['']);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Thêm nhắc nhở mới</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={resetForm}>
            <Ionicons name="refresh-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <MedicationPicker 
            selectedMed={selectedMed} 
            onSelect={(med) => {
              setSelectedMed(med);
              // Tự động điền liều lượng từ backend response
              if (med.strength) {
                setDosage(med.strength);
              } else if (med.dosages && med.dosages.length > 0) {
                setDosage(med.dosages[0]);
              }
            }} 
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Liều lượng</Text>
            <View style={styles.dosageContainer}>
              <TextInput
                style={styles.dosageInput}
                value={dosage}
                onChangeText={setDosage}
                placeholder="Ví dụ: 500mg"
              />
              {selectedMed && (
                <View style={styles.medicineDetails}>
                  <Text style={styles.medicineDetailText}>
                    Loại: {selectedMed.type} • Danh mục: {selectedMed.category}
                  </Text>
                  {selectedMed.notes && (
                    <Text style={styles.medicineNotes} numberOfLines={2}>
                      Ghi chú: {selectedMed.notes}
                    </Text>
                  )}
                </View>
              )}
              {selectedMed && selectedMed.dosages && selectedMed.dosages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dosageOptions}>
                  {selectedMed.dosages.map((d, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={[styles.dosageChip, dosage === d && styles.selectedDosageChip]}
                      onPress={() => setDosage(d)}
                    >
                      <Text style={[styles.dosageChipText, dosage === d && styles.selectedDosageText]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số viên mỗi lần</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mốc giờ nhắc nhở</Text>
            {times.map((time, index) => (
              <View key={index} style={styles.timeRow}>
                <View style={styles.timePickerWrapper}>
                  <TimePicker
                    label={`Lần ${index + 1}`}
                    value={time}
                    onTimeChange={(t) => updateTime(index, t)}
                  />
                </View>
                {times.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeTimeBtn} 
                    onPress={() => removeTime(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            <TouchableOpacity style={styles.addTimeBtn} onPress={addTimeSlot}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.addTimeText}>Thêm mốc giờ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>
              {loading ? 'Đang lưu...' : 'Lưu và đặt nhắc nhở'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  resetBtn: { padding: 8 },
  form: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dosageContainer: { gap: 12 },
  dosageInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medicineDetails: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  medicineDetailText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  medicineNotes: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  dosageOptions: { flexDirection: 'row' },
  dosageChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDosageChip: { backgroundColor: Colors.primaryDark },
  dosageChipText: { fontSize: 14, color: Colors.textMuted },
  selectedDosageText: { color: Colors.white },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  timePickerWrapper: { flex: 1 },
  removeTimeBtn: { marginLeft: 12, marginBottom: 12 },
  addTimeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    borderRadius: 12,
    borderStyle: 'dashed'
  },
  addTimeText: { marginLeft: 8, color: Colors.primaryDark, fontWeight: '500' },
  footer: { 
    padding: 20, 
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border
  },
  saveBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
