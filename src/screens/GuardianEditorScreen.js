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
import TimePicker from '../components/TimePicker';
import AlarmSoundPicker from '../components/AlarmSoundPicker';
import RepeatPatternPicker from '../components/RepeatPatternPicker';
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
    alarmSound: 'alarm1'
  });
  const [times, setTimes] = useState(['08:00']);
  const [repeatPattern, setRepeatPattern] = useState({
    pattern: 'DAILY',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: null,
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
        alarmSound: medication.prescriptionschedule?.customringtone || 'alarm1'
      });

      if (medication.prescriptionschedule) {
        const schedule = medication.prescriptionschedule;
        setTimes([schedule.timeofday || '08:00']);
        setRepeatPattern({
          pattern: schedule.repeatpattern?.toUpperCase() || 'DAILY',
          interval: schedule.interval || 1,
          dayOfWeek: schedule.dayofweek,
          dayOfMonth: schedule.dayofmonth,
        });
      }
    }
  }, [mode, medication]);

  const updateMedField = (field, value) => {
    setSelectedMed(prev => ({ ...prev, [field]: value }));
  };

  const updateTime = (index, value) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const addTimeSlot = () => {
    if (times.length < 4) {
      setTimes([...times, '08:00']);
    }
  };

  const removeTime = (index) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
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
    if (times.some(t => !t)) {
      Alert.alert('Lỗi', 'Vui lòng chọn đầy đủ thời gian nhắc nhở');
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

  const createScheduleForPatient = async (prescriptionId, scheduleData) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/prescriptionschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prescriptionid: prescriptionId,
          ...scheduleData
        }),
      });

      const data = await response.json();
      console.log('Create Schedule Response:', data);

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Không thể tạo lịch trình' };
      }
    } catch (error) {
      console.log('Create Schedule Error:', error);
      return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
    }
  };

  const updateScheduleForPatient = async (scheduleId, scheduleData) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/prescriptionschedule/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(scheduleData),
      });

      const data = await response.json();
      console.log('Update Schedule Response:', data);

      if (data.success) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.message || 'Không thể cập nhật lịch trình' };
      }
    } catch (error) {
      console.log('Update Schedule Error:', error);
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
        frequencyperday: times.length,
        startdate: selectedMed.startDate,
        enddate: selectedMed.endDate,
        remainingquantity: parseInt(selectedMed.quantity) || 1,
        notes: selectedMed.notes || '',
      };

      console.log('Prescription Data:', prescriptionData);

      let prescriptionResult;
      let prescriptionId;

      if (mode === 'edit' && medication) {
        // Update existing prescription
        prescriptionResult = await updatePrescriptionForPatient(
          medication.prescriptionid,
          prescriptionData
        );
        prescriptionId = medication.prescriptionid;
      } else {
        // Create new prescription
        prescriptionResult = await createPrescriptionForPatient(prescriptionData);
        prescriptionId = prescriptionResult.data?.prescriptionid;
      }

      if (!prescriptionResult.success) {
        Alert.alert('Lỗi', prescriptionResult.error);
        setLoading(false);
        return;
      }

      console.log('Prescription saved, ID:', prescriptionId);

      // Create/Update schedules for each time
      for (let i = 0; i < times.length; i++) {
        const scheduleData = {
          timeofday: times[i],
          interval: repeatPattern.interval,
          dayofmonth: repeatPattern.dayOfMonth,
          repeatpattern: repeatPattern.pattern.toLowerCase(),
          dayofweek: repeatPattern.dayOfWeek,
          notificationenabled: true,
          customringtone: selectedMed.alarmSound,
        };

        console.log(`Creating/Updating schedule ${i + 1}:`, scheduleData);

        let scheduleResult;
        if (mode === 'edit' && medication?.prescriptionschedule) {
          // Update existing schedule
          scheduleResult = await updateScheduleForPatient(
            medication.prescriptionschedule.scheduleid,
            scheduleData
          );
        } else {
          // Create new schedule
          scheduleResult = await createScheduleForPatient(prescriptionId, scheduleData);
        }

        if (!scheduleResult.success) {
          console.log(`Schedule ${i + 1} failed:`, scheduleResult.error);
        }
      }

      Alert.alert(
        'Thành công',
        mode === 'edit' 
          ? `Đã cập nhật nhắc nhở cho ${patient.patientFullname}`
          : `Đã tạo nhắc nhở cho ${patient.patientFullname}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.log('Save Error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi lưu nhắc nhở');
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
            <Text style={styles.label}>Chọn thuốc</Text>
            <MedicationPicker
              selectedMed={selectedMed.med}
              onSelect={(med) => updateMedField('med', med)}
            />
          </View>

          {/* Dosage */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Liều lượng</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 1 viên, 5ml, 2 gói..."
              placeholderTextColor={Colors.textMuted}
              value={selectedMed.dosage}
              onChangeText={(text) => updateMedField('dosage', text)}
            />
          </View>

          {/* Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số lượng còn lại</Text>
            <TextInput
              style={styles.input}
              placeholder="Số lượng"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={selectedMed.quantity}
              onChangeText={(text) => updateMedField('quantity', text)}
            />
          </View>

          {/* Start Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày bắt đầu</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              value={selectedMed.startDate}
              onChangeText={(text) => updateMedField('startDate', text)}
            />
          </View>

          {/* End Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày kết thúc</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              value={selectedMed.endDate}
              onChangeText={(text) => updateMedField('endDate', text)}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="VD: Uống sau ăn, tránh ánh nắng..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              value={selectedMed.notes}
              onChangeText={(text) => updateMedField('notes', text)}
            />
          </View>

          {/* Repeat Pattern */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tần suất nhắc nhở</Text>
            <RepeatPatternPicker
              selectedPattern={repeatPattern.pattern}
              interval={repeatPattern.interval}
              dayOfWeek={repeatPattern.dayOfWeek}
              dayOfMonth={repeatPattern.dayOfMonth}
              onPatternChange={(data) => setRepeatPattern(data)}
            />
          </View>

          {/* Time Slots */}
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
            
            {times.length < 4 && (
              <TouchableOpacity 
                style={styles.addTimeBtn} 
                onPress={addTimeSlot}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addTimeText}>Thêm mốc giờ</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Alarm Sound */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Âm thanh nhắc nhở</Text>
            <AlarmSoundPicker
              selectedSound={selectedMed.alarmSound}
              onSoundSelect={(sound) => updateMedField('alarmSound', sound)}
            />
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
              {loading ? 'Đang lưu...' : (mode === 'edit' ? 'Cập nhật' : 'Lưu và đặt nhắc nhở')}
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    marginBottom: 16 
  },
  timePickerWrapper: { 
    flex: 1 
  },
  removeTimeBtn: { 
    marginLeft: 12, 
    marginBottom: 12 
  },
  addTimeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    borderStyle: 'dashed'
  },
  addTimeText: { 
    marginLeft: 8, 
    color: Colors.primary, 
    fontWeight: '500' 
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
