import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { 
  getPrescriptionSchedules, 
  updatePrescriptionSchedule, 
  getMedicines,
  getPrescriptions,
  updatePrescription
} from '../services/auth';

export default function PrescriptionDetailScreen({ route, navigation }) {
  const { prescription } = route.params;
  const [schedules, setSchedules] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicineMap, setMedicineMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);

  const [editForm, setEditForm] = useState({
    medicineid: prescription.medicineid.toString(),
    dosage: prescription.dosage,
    frequencyperday: prescription.frequencyperday,
    startdate: prescription.startdate,
    enddate: prescription.enddate,
    notes: prescription.notes || ''
  });
  
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleEditForm, setScheduleEditForm] = useState({
    timeofday: '',
    repeatPattern: 'DAILY',
    notificationenabled: true,
    dayOfWeek: null,
    interval: null,
    dayofmonth: null,
    customringtone: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('=== DEBUG LOAD DATA ===');
      console.log('Prescription:', prescription);
      console.log('Current user ID from prescription:', prescription?.userid);

      // Load medicines first
      const medicinesResult = await getMedicines(1, 100);
      console.log('Medicines result:', medicinesResult);
      
      if (medicinesResult.success) {
        const medicinesList = medicinesResult.data.items || [];
        setMedicines(medicinesList);
        
        // Create medicine ID to name mapping
        const mapping = {};
        medicinesList.forEach(medicine => {
          mapping[medicine.medicineid] = medicine.name;
        });
        setMedicineMap(mapping);
        console.log('Medicine mapping:', mapping);
      }

      // Load prescription schedules
      const schedulesResult = await getPrescriptionSchedules();
      console.log('Schedules result:', schedulesResult);
      
      if (schedulesResult.success) {
        // Filter schedules for this prescription
        const prescriptionSchedules = schedulesResult.data.items.filter(
          schedule => schedule.prescriptionid === prescription.prescriptionid
        );
        console.log('Filtered schedules:', prescriptionSchedules);
        console.log('Schedule ownership check:');
        prescriptionSchedules.forEach(schedule => {
          console.log(`Schedule ID ${schedule.id}: prescriptionId=${schedule.prescriptionid}, userId=${schedule.userid || 'undefined'}`);
        });
        setSchedules(prescriptionSchedules);
      }
    } catch (error) {
      console.log('Load data error:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const getMedicineName = (medicineId) => {
    const medicine = medicines.find(m => m.medicineid.toString() === medicineId);
    return medicine ? medicine.name : `Thuốc ID: ${medicineId}`;
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const handleUpdatePrescription = async () => {
    // Validate form
    if (!editForm.dosage.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập liều lượng');
      return;
    }
    if (editForm.frequencyperday < 1) {
      Alert.alert('Lỗi', 'Tần suất phải lớn hơn 0');
      return;
    }
    
    if (editForm.enddate < editForm.startdate) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu');
      return;
    }

    setSaving(true);
    try {
      const prescriptionData = {
        dosage: editForm.dosage.trim(),
        frequencyperday: editForm.frequencyperday,
        startdate: editForm.startdate,
        enddate: editForm.enddate,
        remainingquantity: prescription.remainingquantity || 2147483647,
        doctorname: prescription.doctorname || "string",
        notes: editForm.notes.trim() || null
      };

      console.log('=== UPDATING PRESCRIPTION ===');
      console.log('Prescription ID:', prescription.prescriptionid);
      console.log('Prescription Data:', prescriptionData);

      const result = await updatePrescription(prescription.prescriptionid, prescriptionData);

      console.log('Update Result:', result);

      if (result.success) {
        Alert.alert('Thành công', 'Đã cập nhật đơn thuốc thành công!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        Alert.alert('Lỗi', result.error);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật đơn thuốc');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleEditForm({
      timeofday: schedule.timeofday,
      repeatPattern: schedule.repeatPattern || 'DAILY',
      notificationenabled: schedule.notificationenabled,
      dayOfWeek: schedule.dayOfWeek,
      interval: schedule.interval,
      dayofmonth: schedule.dayofmonth,
      customringtone: schedule.customringtone
    });
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;
    
    if (!scheduleEditForm.timeofday) {
      Alert.alert('Lỗi', 'Vui lòng nhập giờ uống thuốc');
      return;
    }

    console.log('=== DEBUG UPDATE SCHEDULE ===');
    console.log('Editing schedule:', editingSchedule);
    console.log('Schedule form data:', scheduleEditForm);

    setSaving(true);
    try {
      const scheduleData = {
        timeofday: scheduleEditForm.timeofday,
        repeatPattern: scheduleEditForm.repeatPattern.toLowerCase(), // API expects lowercase
        notificationenabled: scheduleEditForm.notificationenabled,
        dayOfWeek: scheduleEditForm.dayOfWeek?.toLowerCase() || null, // API expects lowercase
        interval: scheduleEditForm.interval || 1,
        dayofmonth: scheduleEditForm.dayofmonth || null,
        customringtone: scheduleEditForm.customringtone || null
      };

      console.log('Sending schedule data:', scheduleData);
      console.log('Schedule ID:', editingSchedule.scheduleid);

      const result = await updatePrescriptionSchedule(editingSchedule.scheduleid, scheduleData);

      console.log('API Response:', result);

      if (result.success) {
        Alert.alert('Thành công', 'Đã cập nhật lịch trình thành công!');
        setEditingSchedule(null);
        loadData(); // Reload data to reflect changes
      } else {
        console.log('API Error:', result.error);
        Alert.alert('Lỗi', result.error);
      }
    } catch (error) {
      console.log('Catch Error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật lịch trình');
    } finally {
      setSaving(false);
    }
  };

  const renderScheduleItem = ({ item }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={20} color={Colors.primary} />
          <Text style={styles.timeText}>{formatTime(item.timeofday)}</Text>
        </View>
        <View style={styles.scheduleActions}>
          <View style={styles.patternBadge}>
            <Text style={styles.patternText}>{item.repeatPattern}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditSchedule(item)}
          >
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.scheduleInfo}>
        <View style={styles.infoRow}>
          <Ionicons 
            name={item.notificationenabled ? "notifications" : "notifications-off"} 
            size={16} 
            color={item.notificationenabled ? Colors.success : Colors.textMuted} 
          />
          <Text style={styles.infoText}>
            {item.notificationenabled ? 'Thông báo bật' : 'Thông báo tắt'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Chi tiết nhắc nhở</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết nhắc nhở</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Medicine Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin thuốc</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên thuốc</Text>
            <View style={[styles.dropdownButton, styles.disabledInput]}>
              <Text style={styles.dropdownButtonText}>
                {editForm.medicineid ? 
                  getMedicineName(editForm.medicineid) : 
                  'Không xác định'
                }
              </Text>
              <Ionicons 
                name="lock-closed-outline" 
                size={16} 
                color={Colors.textMuted} 
              />
            </View>
            <Text style={styles.helperText}>Không thể thay đổi thuốc sau khi tạo</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Liều lượng *</Text>
            <TextInput
              style={styles.input}
              value={editForm.dosage}
              onChangeText={(text) => setEditForm({...editForm, dosage: text})}
              placeholder="Ví dụ: 500mg, 1 viên"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tần suất mỗi ngày *</Text>
            <TextInput
              style={styles.input}
              value={editForm.frequencyperday.toString()}
              onChangeText={(text) => setEditForm({...editForm, frequencyperday: parseInt(text) || 1})}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>Ngày bắt đầu *</Text>
              <TextInput
                style={styles.input}
                value={editForm.startdate}
                onChangeText={(text) => setEditForm({...editForm, startdate: text})}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.inputLabel}>Ngày kết thúc *</Text>
              <TextInput
                style={styles.input}
                value={editForm.enddate}
                onChangeText={(text) => setEditForm({...editForm, enddate: text})}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editForm.notes}
              onChangeText={(text) => setEditForm({...editForm, notes: text})}
              placeholder="Ghi chú thêm về cách dùng thuốc..."
              multiline={true}
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Schedules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch trình uống thuốc ({schedules.length})</Text>
          {schedules.length > 0 ? (
            <FlatList
              data={schedules}
              renderItem={renderScheduleItem}
              keyExtractor={(item) => item.scheduleid.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptySchedules}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Chưa có lịch trình nào</Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleUpdatePrescription}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Đang cập nhật...' : 'Lưu thay đổi'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Schedule Edit Modal */}
      {editingSchedule && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa lịch trình</Text>
              <TouchableOpacity onPress={() => setEditingSchedule(null)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Thời gian uống thuốc *</Text>
                <TextInput
                  style={styles.input}
                  value={scheduleEditForm.timeofday}
                  onChangeText={(text) => setScheduleEditForm({...scheduleEditForm, timeofday: text})}
                  placeholder="HH:MM:SS (ví dụ: 08:00:00)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lặp lại</Text>
                <View style={styles.radioGroup}>
                  {['DAILY', 'WEEKLY', 'MONTHLY'].map(pattern => (
                    <TouchableOpacity
                      key={pattern}
                      style={[
                        styles.radioOption,
                        scheduleEditForm.repeatPattern === pattern && styles.radioOptionSelected
                      ]}
                      onPress={() => setScheduleEditForm({...scheduleEditForm, repeatPattern: pattern})}
                    >
                      <Text style={[
                        styles.radioText,
                        scheduleEditForm.repeatPattern === pattern && styles.radioTextSelected
                      ]}>
                        {pattern === 'DAILY' ? 'Hàng ngày' : pattern === 'WEEKLY' ? 'Hàng tuần' : 'Hàng tháng'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {scheduleEditForm.repeatPattern === 'WEEKLY' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Thứ trong tuần</Text>
                  <View style={styles.weekDayGroup}>
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          scheduleEditForm.dayOfWeek === day && styles.dayButtonSelected
                        ]}
                        onPress={() => setScheduleEditForm({...scheduleEditForm, dayOfWeek: day})}
                      >
                        <Text style={[
                          styles.dayText,
                          scheduleEditForm.dayOfWeek === day && styles.dayTextSelected
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {scheduleEditForm.repeatPattern === 'MONTHLY' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ngày trong tháng</Text>
                  <TextInput
                    style={styles.input}
                    value={scheduleEditForm.dayofmonth?.toString() || ''}
                    onChangeText={(text) => setScheduleEditForm({...scheduleEditForm, dayofmonth: parseInt(text) || null})}
                    placeholder="1-31"
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.inputLabel}>Bật thông báo</Text>
                  <TouchableOpacity
                    style={[
                      styles.switch,
                      scheduleEditForm.notificationenabled && styles.switchActive
                    ]}
                    onPress={() => setScheduleEditForm({
                      ...scheduleEditForm, 
                      notificationenabled: !scheduleEditForm.notificationenabled
                    })}
                  >
                    <View style={[
                      styles.switchThumb,
                      scheduleEditForm.notificationenabled && styles.switchThumbActive
                    ]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setEditingSchedule(null)}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.updateButton, saving && styles.updateButtonDisabled]}
                  onPress={handleUpdateSchedule}
                  disabled={saving}
                >
                  <Text style={styles.updateButtonText}>
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textMuted,
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  // Form styles
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  dropdownPlaceholderText: {
    color: Colors.textMuted,
  },
  disabledInput: {
    backgroundColor: Colors.surface,
    opacity: 0.8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    maxHeight: 200,
  },
  medicineDropdown: {
    maxHeight: 180,
  },
  medicineOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedMedicineOption: {
    backgroundColor: Colors.primary + '20',
  },
  medicineOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  selectedMedicineOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  medicineOptionDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Schedule styles
  separator: {
    height: 12,
  },
  scheduleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  patternBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  patternText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  scheduleInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Empty state
  emptySchedules: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 12,
  },

  // Save button
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalContent: {
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },

  // Radio group styles
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#ffffff',
  },
  radioOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radioText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  radioTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Week day styles
  weekDayGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#ffffff',
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Switch styles
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: Colors.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },

  // Modal action buttons
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});