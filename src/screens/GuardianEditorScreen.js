import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import MedicationPicker from '../components/MedicationPicker';
import AlarmSoundPicker from '../components/AlarmSoundPicker';
import DatePicker from '../components/DatePicker';
import { getAuthToken } from '../services/auth';
import dayjs from 'dayjs';

const API_BASE_URL = 'https://medtime-be.onrender.com/api';

export default function GuardianEditorScreen({ navigation, route }) {
  const { patient, mode, medication } = route.params;
  const patientId = patient.patientid;

  const [selectedMed, setSelectedMed] = useState({
    med: null,
    dosage: '',
    quantity: '1',
    notes: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    alarmSound: 'alarm1',
    frequency: 1,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load existing medication data if in edit mode
    if (mode === 'edit' && medication) {
      setSelectedMed({
        med: medication.medicine,
        dosage: medication.dosage || '',
        quantity: medication.quantity?.toString() || '1',
        notes: medication.notes || '',
        startDate: medication.startdate ? dayjs(medication.startdate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        endDate: medication.enddate ? dayjs(medication.enddate).format('YYYY-MM-DD') : dayjs().add(30, 'day').format('YYYY-MM-DD'),
        alarmSound: medication.prescriptionschedule?.customringtone || 'alarm1',
        frequency: medication.frequencyperday || 1,
      });
    }
  }, [mode, medication]);

  const updateMedField = (field, value) => {
    setSelectedMed(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!selectedMed.med) {
      Alert.alert('Lỗi', 'Vui lòng chọn thuốc');
      return false;
    }
    if (!selectedMed.dosage) {
      Alert.alert('Lỗi', 'Vui lòng nhập liều lượng');
      return false;
    }
    return true;
  };

  const createPrescriptionForPatient = async (prescriptionData) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/prescription?patientId=${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(prescriptionData),
      });

      const data = await response.json();
      console.log('Create Prescription Response:', data);

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Không thể tạo nhắc nhở' };
      }
    } catch (error) {
      console.log('Create Prescription Error:', error);
      return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
    }
  };

  const updatePrescriptionForPatient = async (prescriptionId, prescriptionData) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/prescription/${prescriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(prescriptionData),
      });

      const data = await response.json();
      console.log('Update Prescription Response:', data);

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Không thể cập nhật nhắc nhở' };
      }
    } catch (error) {
      console.log('Update Prescription Error:', error);
      return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
    }
  };



  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    console.log('=== GUARDIAN CREATE/UPDATE PRESCRIPTION ===');
    console.log('Patient ID:', patientId);
    console.log('Mode:', mode);

    try {
      // Prepare prescription data
      const prescriptionData = {
        medicineid: selectedMed.med.medicineid,
        dosage: selectedMed.dosage,
        frequencyperday: selectedMed.frequency,
        startdate: selectedMed.startDate,
        enddate: selectedMed.endDate,
        remainingquantity: parseInt(selectedMed.quantity) || 1,
        doctorname: '',
        notes: selectedMed.notes || '',
      };

      console.log('Prescription Data:', prescriptionData);

      let prescriptionResult;

      if (mode === 'edit' && medication) {
        // Update existing prescription
        prescriptionResult = await updatePrescriptionForPatient(
          medication.prescriptionid,
          prescriptionData
        );
      } else {
        // Create new prescription
        prescriptionResult = await createPrescriptionForPatient(prescriptionData);
      }

      if (!prescriptionResult.success) {
        Alert.alert('Lỗi', prescriptionResult.error);
        setLoading(false);
        return;
      }

      Alert.alert(
        'Thành công',
        mode === 'edit' 
          ? `Đã cập nhật đơn thuốc cho ${patient.patientFullname}`
          : `Đã tạo đơn thuốc cho ${patient.patientFullname}. Vui lòng thiết lập lịch nhắc nhở trong màn hình chi tiết.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.log('Save Error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi lưu đơn thuốc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              {mode === 'edit' ? 'Chỉnh sửa nhắc nhở' : 'Thêm nhắc nhở mới'}
            </Text>
            <Text style={styles.guardianModeText}>
              Cho bệnh nhân: {patient.patientFullname}
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Form */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          
          {/* Medicine Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chọn thuốc cần nhắc nhở</Text>
            <Text style={styles.hintText}>💡 Nhấn vào "Chọn thuốc" để tìm và chọn thuốc từ danh sách</Text>
            <View style={styles.medicationPickerContainer}>
              <MedicationPicker
                selectedMed={selectedMed.med}
                onSelect={(med) => {
                  console.log('GuardianEditorScreen onSelect:', med);
                  // Auto-fill dosage if medicine is selected
                  if (med && (!selectedMed.dosage || selectedMed.dosage.trim() === '')) {
                    if (med.strength) {
                      updateMedField('dosage', med.strength);
                    } else if (med.dosages && med.dosages.length > 0) {
                      updateMedField('dosage', med.dosages[0]);
                    }
                  }
                  // Clear dosage if medicine is cleared
                  if (!med) {
                    updateMedField('dosage', '');
                  }
                  updateMedField('med', med);
                }}
              />
            </View>

            {/* Medicine Details */}
            {selectedMed.med && (
              <View style={styles.medicineDetails}>
                {selectedMed.med.type && (
                  <View style={styles.detailRow}>
                    <Ionicons name="flask-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.detailText}>Loại: {selectedMed.med.type}</Text>
                  </View>
                )}
                {selectedMed.med.category && (
                  <View style={styles.detailRow}>
                    <Ionicons name="medical-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.detailText}>Danh mục: {selectedMed.med.category}</Text>
                  </View>
                )}
                {selectedMed.med.notes && (
                  <View style={styles.detailRow}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.detailText}>{selectedMed.med.notes}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Dosage and Quantity */}
          <View style={styles.dosageQuantityRow}>
            <View style={styles.dosageContainer}>
              <Text style={styles.subLabel}>Liều lượng</Text>
              <TextInput
                style={styles.dosageInput}
                value={selectedMed.dosage || ''}
                onChangeText={(text) => updateMedField('dosage', text)}
                placeholder="Ví dụ: 500mg"
              />
              {selectedMed.med && selectedMed.med.dosages && selectedMed.med.dosages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dosageOptions}>
                  {selectedMed.med.dosages.map((d, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={[styles.dosageChip, selectedMed.dosage === d && styles.selectedDosageChip]}
                      onPress={() => updateMedField('dosage', d)}
                    >
                      <Text style={[styles.dosageChipText, selectedMed.dosage === d && styles.selectedDosageText]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.quantityContainer}>
              <Text style={styles.subLabel}>Số lượng</Text>
              <TextInput
                style={styles.quantityInput}
                value={selectedMed.quantity || '1'}
                onChangeText={(text) => updateMedField('quantity', text)}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Start and End Date */}
          <View style={styles.dateRow}>
            <View style={styles.dateContainer}>
              <DatePicker
                label="Ngày bắt đầu"
                value={selectedMed.startDate}
                onDateChange={(date) => updateMedField('startDate', date)}
                minDate={dayjs().format('YYYY-MM-DD')}
              />
            </View>

            <View style={styles.dateContainer}>
              <DatePicker
                label="Ngày kết thúc"
                value={selectedMed.endDate}
                onDateChange={(date) => updateMedField('endDate', date)}
                minDate={selectedMed.startDate || dayjs().format('YYYY-MM-DD')}
              />
            </View>
          </View>

          {/* Frequency */}
          <View style={styles.frequencySection}>
            <Text style={styles.subLabel}>Tần suất/ngày (tối đa 4 lần)</Text>
            <View style={styles.frequencyOptions}>
              {[1, 2, 3, 4].map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyChip,
                    selectedMed.frequency === freq && styles.selectedFrequencyChip
                  ]}
                  onPress={() => updateMedField('frequency', freq)}
                >
                  <Ionicons 
                    name="time-outline" 
                    size={18} 
                    color={selectedMed.frequency === freq ? Colors.white : Colors.primary} 
                  />
                  <Text style={[
                    styles.frequencyChipText,
                    selectedMed.frequency === freq && styles.selectedFrequencyText
                  ]}>
                    {freq} lần
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.subLabel}>Ghi chú</Text>
            <TextInput
              style={styles.notesInput}
              value={selectedMed.notes || ''}
              onChangeText={(text) => updateMedField('notes', text)}
              placeholder="Thêm ghi chú về cách dùng thuốc..."
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Alarm Sound */}
          <View style={styles.inputGroup}>
            <Text style={styles.subLabel}>Âm thanh nhắc nhở</Text>
            <AlarmSoundPicker
              selectedSound={selectedMed.alarmSound}
              onSoundSelect={(sound) => updateMedField('alarmSound', sound.id)}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Sau khi lưu, bạn có thể thiết lập lịch nhắc nhở trong màn hình chi tiết bệnh nhân.
            </Text>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>
              {loading ? 'Đang lưu...' : (mode === 'edit' ? 'Cập nhật đơn thuốc' : 'Tạo đơn thuốc')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  backButton: {
    padding: 8,
  },
  headerLeft: {
    flex: 1,
    marginLeft: 8,
  },
  headerRight: {
    width: 40,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: Colors.textPrimary 
  },
  guardianModeText: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  form: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 20 
  },
  inputGroup: { 
    marginBottom: 24 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.textSecondary, 
    marginBottom: 8 
  },
  subLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  medicationPickerContainer: {
    marginBottom: 12,
  },
  medicineDetails: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  dosageQuantityRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  dosageContainer: {
    flex: 2,
  },
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
  dosageOptions: {
    marginTop: 8,
    maxHeight: 40,
  },
  dosageChip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedDosageChip: {
    backgroundColor: Colors.primary,
  },
  dosageChipText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  selectedDosageText: {
    color: Colors.white,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  dateContainer: {
    flex: 1,
  },
  frequencySection: {
    marginBottom: 20,
  },
  frequencyOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  selectedFrequencyChip: {
    backgroundColor: Colors.primary,
  },
  frequencyChipText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedFrequencyText: {
    color: Colors.white,
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
  },
  footer: { 
    padding: 20, 
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { 
    opacity: 0.6 
  },
  saveBtnText: { 
    color: Colors.white, 
    fontSize: 16, 
    fontWeight: '600' 
  },
});
