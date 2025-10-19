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
  Modal,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import MedicationPicker from '../components/MedicationPicker';
import TimePicker from '../components/TimePicker';
import { addMedication, getAllMedications } from '../services/storage';
import { scheduleReminder, buildDateFromTime } from '../services/notifications';
import { getPrescriptions, getPrescriptionSchedules, updatePrescriptionSchedule, getMedicines, createPrescription } from '../services/auth';
import dayjs from 'dayjs';

export default function EditorScreen({ navigation }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicineMap, setMedicineMap] = useState({}); // Map ID -> tên thuốc
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  // States for create new prescription
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [createForm, setCreateForm] = useState({
    medicineid: '',
    dosage: '',
    frequencyperday: 1,
    startdate: new Date().toISOString().split('T')[0],
    enddate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const [prescriptionResult, scheduleResult, medicineResult] = await Promise.all([
        getPrescriptions(),
        getPrescriptionSchedules(),
        getMedicines(1, 100) // Load first 100 medicines
      ]);
      
      if (prescriptionResult.success) {
        setPrescriptions(prescriptionResult.data.items || []);
      }
      
      if (scheduleResult.success) {
        setSchedules(scheduleResult.data.items || []);
      }

      if (medicineResult.success) {
        const medicineItems = medicineResult.data.items || [];
        setMedicines(medicineItems);
        
        // Create medicine ID -> name mapping
        const map = {};
        medicineItems.forEach(medicine => {
          map[medicine.medicineid] = medicine.name;
        });
        setMedicineMap(map);
      }
    } catch (error) {
      console.log('Error loading prescriptions:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách nhắc nhở');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
    
    // Listen for navigation focus to refresh data
    const unsubscribe = navigation.addListener('focus', () => {
      loadPrescriptions();
    });

    return unsubscribe;
  }, [navigation]);

  const getMedicineName = (medicineId) => {
    return medicineMap[medicineId] || `Thuốc ID: ${medicineId}`;
  };

  const handlePrescriptionPress = (prescription) => {
    const prescriptionSchedules = schedules.filter(
      schedule => schedule.prescriptionid === prescription.prescriptionid
    );
    setSelectedPrescription({ ...prescription, schedules: prescriptionSchedules });
    setShowEditModal(true);
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule({
      ...schedule,
      timeofday: schedule.timeofday || '08:00:00',
      repeatPattern: schedule.repeatPattern || 'DAILY',
      notificationenabled: schedule.notificationenabled !== false
    });
  };

  const handleSaveSchedule = async () => {
    if (!editingSchedule) return;

    setLoading(true);
    try {
      const result = await updatePrescriptionSchedule(editingSchedule.scheduleid, {
        timeofday: editingSchedule.timeofday,
        interval: editingSchedule.interval,
        dayofmonth: editingSchedule.dayofmonth,
        repeatPattern: editingSchedule.repeatPattern,
        dayOfWeek: editingSchedule.dayOfWeek,
        notificationenabled: editingSchedule.notificationenabled,
        customringtone: editingSchedule.customringtone
      });

      if (result.success) {
        Alert.alert('Thành công', 'Đã cập nhật lịch trình thành công');
        setEditingSchedule(null);
        loadPrescriptions(); // Refresh data
      } else {
        Alert.alert('Lỗi', result.error);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật lịch trình');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async () => {
    // Validate form
    if (!createForm.medicineid) {
      Alert.alert('Lỗi', 'Vui lòng chọn thuốc');
      return;
    }
    if (!createForm.dosage.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập liều lượng');
      return;
    }
    if (createForm.frequencyperday < 1) {
      Alert.alert('Lỗi', 'Tần suất phải lớn hơn 0');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (createForm.startdate < today) {
      Alert.alert('Lỗi', 'Ngày bắt đầu phải là hôm nay hoặc trong tương lai');
      return;
    }
    
    if (createForm.enddate < createForm.startdate) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu');
      return;
    }

    setLoading(true);
    try {
      const prescriptionData = {
        medicineid: parseInt(createForm.medicineid),
        dosage: createForm.dosage.trim(),
        frequencyperday: createForm.frequencyperday,
        startdate: createForm.startdate,
        enddate: createForm.enddate,
        remainingquantity: 2147483647, // Default value
        doctorname: "string", // Default value as requested
        notes: createForm.notes.trim() || null
      };

      const result = await createPrescription(prescriptionData);

      if (result.success) {
        Alert.alert('Thành công', 'Đã tạo nhắc nhở thành công!', [
          {
            text: 'OK',
            onPress: () => {
              setShowCreateModal(false);
              resetCreateForm();
              loadPrescriptions(); // Refresh data
            }
          }
        ]);
      } else {
        Alert.alert('Lỗi', result.error);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo nhắc nhở');
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setCreateForm({
      medicineid: '',
      dosage: '',
      frequencyperday: 1,
      startdate: today,
      enddate: today,
      notes: ''
    });
  };

  const handleStartDateChange = (selectedDate) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Không cho chọn ngày trong quá khứ
    if (selectedDate < today) {
      Alert.alert('Lỗi', 'Ngày bắt đầu phải là hôm nay hoặc trong tương lai');
      return;
    }
    
    setCreateForm(prev => {
      const newForm = { ...prev, startdate: selectedDate };
      // Nếu enddate nhỏ hơn startdate mới, tự động cập nhật enddate
      if (prev.enddate < selectedDate) {
        newForm.enddate = selectedDate;
      }
      return newForm;
    });
  };

  const handleEndDateChange = (selectedDate) => {
    // Không cho chọn ngày trước startdate
    if (selectedDate < createForm.startdate) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu');
      return;
    }
    
    setCreateForm(prev => ({ ...prev, enddate: selectedDate }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Danh sách nhắc nhở</Text>
          <Text style={styles.subtitle}>
            {prescriptions.length} đơn thuốc
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadPrescriptions}>
          <Ionicons name="refresh-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách nhắc nhở...</Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.prescriptionid.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.prescriptionCard}
              onPress={() => handlePrescriptionPress(item)}
            >
              <View style={styles.prescriptionHeader}>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicationName}>
                    {getMedicineName(item.medicineid)}
                  </Text>
                  <Text style={styles.dosageText}>{item.dosage}</Text>
                </View>
                <View style={styles.frequencyBadge}>
                  <Text style={styles.frequencyText}>{item.frequencyperday}x/ngày</Text>
                </View>
              </View>
              
              <View style={styles.prescriptionDetails}>
                <Text style={styles.dateRange}>
                  {new Date(item.startdate).toLocaleDateString('vi-VN')} - {new Date(item.enddate).toLocaleDateString('vi-VN')}
                </Text>
                <Text style={styles.doctorName}>BS: {item.doctorname}</Text>
                {item.notes && (
                  <Text style={styles.notes} numberOfLines={2}>
                    Ghi chú: {item.notes}
                  </Text>
                )}
              </View>
              
              <View style={styles.schedulePreview}>
                {schedules
                  .filter(schedule => schedule.prescriptionid === item.prescriptionid)
                  .slice(0, 3)
                  .map((schedule, index) => (
                    <View key={schedule.scheduleid} style={styles.timeSlot}>
                      <Text style={styles.timeText}>{schedule.timeofday.slice(0, 5)}</Text>
                    </View>
                  ))
                }
                {schedules.filter(schedule => schedule.prescriptionid === item.prescriptionid).length > 3 && (
                  <Text style={styles.moreSchedules}>
                    +{schedules.filter(schedule => schedule.prescriptionid === item.prescriptionid).length - 3} khác
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyStateTitle}>Chưa có nhắc nhở nào</Text>
              <Text style={styles.emptyStateText}>
                Danh sách nhắc nhở thuốc sẽ hiển thị ở đây
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button Container */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Edit Schedule Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết nhắc nhở</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingSchedule(null);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedPrescription && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.prescriptionInfo}>
                  <Text style={styles.prescriptionTitle}>
                    {getMedicineName(selectedPrescription.medicineid)}
                  </Text>
                  <Text style={styles.prescriptionDetail}>
                    Liều lượng: {selectedPrescription.dosage}
                  </Text>
                  <Text style={styles.prescriptionDetail}>
                    Tần suất: {selectedPrescription.frequencyperday} lần/ngày
                  </Text>
                  <Text style={styles.prescriptionDetail}>
                    Thời gian: {new Date(selectedPrescription.startdate).toLocaleDateString('vi-VN')} - {new Date(selectedPrescription.enddate).toLocaleDateString('vi-VN')}
                  </Text>
                  <Text style={styles.prescriptionDetail}>
                    Bác sĩ: {selectedPrescription.doctorname}
                  </Text>
                  {selectedPrescription.notes && (
                    <Text style={styles.prescriptionNotes}>
                      Ghi chú: {selectedPrescription.notes}
                    </Text>
                  )}
                </View>

                <Text style={styles.schedulesTitle}>Lịch trình nhắc nhở:</Text>
                {selectedPrescription.schedules?.map((schedule) => (
                  <View key={schedule.scheduleid} style={styles.scheduleItem}>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleTime}>{schedule.timeofday.slice(0, 5)}</Text>
                      <Text style={styles.schedulePattern}>{schedule.repeatPattern}</Text>
                      <Text style={styles.scheduleNotification}>
                        {schedule.notificationenabled ? 'Có thông báo' : 'Không thông báo'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => handleEditSchedule(schedule)}
                    >
                      <Ionicons name="create-outline" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Schedule Detail Modal */}
      <Modal
        visible={editingSchedule !== null}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa lịch trình</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setEditingSchedule(null)}
              >
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {editingSchedule && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.editForm}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Thời gian</Text>
                    <TextInput
                      style={styles.input}
                      value={editingSchedule.timeofday || ''}
                      onChangeText={(text) => setEditingSchedule({...editingSchedule, timeofday: text})}
                      placeholder="HH:MM:SS"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mẫu lặp lại</Text>
                    <View style={styles.optionsContainer}>
                      {['DAILY', 'WEEKLY', 'MONTHLY'].map((pattern) => (
                        <TouchableOpacity 
                          key={pattern}
                          style={[
                            styles.optionButton,
                            editingSchedule.repeatPattern === pattern && styles.selectedOption
                          ]}
                          onPress={() => setEditingSchedule({...editingSchedule, repeatPattern: pattern})}
                        >
                          <Text style={[
                            styles.optionText,
                            editingSchedule.repeatPattern === pattern && styles.selectedOptionText
                          ]}>
                            {pattern === 'DAILY' ? 'Hàng ngày' : 
                             pattern === 'WEEKLY' ? 'Hàng tuần' : 'Hàng tháng'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.checkboxContainer}>
                      <TouchableOpacity 
                        style={styles.checkbox}
                        onPress={() => setEditingSchedule({
                          ...editingSchedule, 
                          notificationenabled: !editingSchedule.notificationenabled
                        })}
                      >
                        <Ionicons 
                          name={editingSchedule.notificationenabled ? "checkbox" : "square-outline"} 
                          size={24} 
                          color={editingSchedule.notificationenabled ? Colors.primary : Colors.textMuted} 
                        />
                      </TouchableOpacity>
                      <Text style={styles.checkboxLabel}>Bật thông báo</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSaveSchedule}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Create New Prescription Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo nhắc nhở mới</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Chọn thuốc *</Text>
                  <View style={styles.dropdownContainer}>
                    <Text style={styles.dropdownPlaceholder}>
                      {createForm.medicineid ? 
                        getMedicineName(createForm.medicineid) : 
                        'Chọn thuốc từ danh sách'
                      }
                    </Text>
                    <ScrollView style={styles.medicineDropdown} nestedScrollEnabled={true}>
                      {medicines.map((medicine) => (
                        <TouchableOpacity 
                          key={medicine.medicineid}
                          style={[
                            styles.medicineOption,
                            createForm.medicineid === medicine.medicineid.toString() && styles.selectedMedicineOption
                          ]}
                          onPress={() => setCreateForm({...createForm, medicineid: medicine.medicineid.toString()})}
                        >
                          <Text style={[
                            styles.medicineOptionText,
                            createForm.medicineid === medicine.medicineid.toString() && styles.selectedMedicineOptionText
                          ]}>
                            {medicine.name}
                          </Text>
                          <Text style={styles.medicineOptionDetail}>
                            {medicine.strengthvalue}{medicine.strengthunit} - {medicine.type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Liều lượng *</Text>
                  <TextInput
                    style={styles.input}
                    value={createForm.dosage}
                    onChangeText={(text) => setCreateForm({...createForm, dosage: text})}
                    placeholder="Ví dụ: 500mg, 1 viên"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tần suất mỗi ngày *</Text>
                  <TextInput
                    style={styles.input}
                    value={createForm.frequencyperday.toString()}
                    onChangeText={(text) => setCreateForm({...createForm, frequencyperday: parseInt(text) || 1})}
                    placeholder="1"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ngày bắt đầu *</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.datePickerText}>
                      {new Date(createForm.startdate + 'T00:00:00').toLocaleDateString('vi-VN')}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ngày kết thúc *</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.datePickerText}>
                      {new Date(createForm.enddate + 'T00:00:00').toLocaleDateString('vi-VN')}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ghi chú</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={createForm.notes}
                    onChangeText={(text) => setCreateForm({...createForm, notes: text})}
                    placeholder="Ghi chú thêm về cách dùng thuốc..."
                    multiline={true}
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={handleCreatePrescription}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Đang tạo...' : 'Tạo nhắc nhở'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Start Date Picker Modal */}
      <Modal
        visible={showStartDatePicker}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>Chọn ngày bắt đầu</Text>
            <ScrollView style={styles.dateList}>
              {Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dateString = date.toISOString().split('T')[0];
                return (
                  <TouchableOpacity
                    key={dateString}
                    style={[
                      styles.dateOption,
                      createForm.startdate === dateString && styles.selectedDateOption
                    ]}
                    onPress={() => {
                      handleStartDateChange(dateString);
                      setShowStartDatePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      createForm.startdate === dateString && styles.selectedDateText
                    ]}>
                      {date.toLocaleDateString('vi-VN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity 
              style={styles.cancelDateButton}
              onPress={() => setShowStartDatePicker(false)}
            >
              <Text style={styles.cancelDateText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* End Date Picker Modal */}
      <Modal
        visible={showEndDatePicker}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>Chọn ngày kết thúc</Text>
            <ScrollView style={styles.dateList}>
              {Array.from({ length: 60 }, (_, i) => {
                const startDate = new Date(createForm.startdate + 'T00:00:00');
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const dateString = date.toISOString().split('T')[0];
                return (
                  <TouchableOpacity
                    key={dateString}
                    style={[
                      styles.dateOption,
                      createForm.enddate === dateString && styles.selectedDateOption
                    ]}
                    onPress={() => {
                      handleEndDateChange(dateString);
                      setShowEndDatePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      createForm.enddate === dateString && styles.selectedDateText
                    ]}>
                      {date.toLocaleDateString('vi-VN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity 
              style={styles.cancelDateButton}
              onPress={() => setShowEndDatePicker(false)}
            >
              <Text style={styles.cancelDateText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerLeft: {
    flex: 1,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  refreshBtn: { padding: 8 },
  
  // FAB styles
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingBottom: 100, // Khoảng cách lớn cho tab navigation
    paddingRight: 20,
  },
  fab: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textMuted,
  },

  // List styles
  listContainer: {
    padding: 20,
    paddingBottom: 120, // Tạo không gian cho FAB và tab navigation
  },
  
  // Prescription card styles
  prescriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicineInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dosageText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  frequencyBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  prescriptionDetails: {
    marginBottom: 12,
  },
  dateRange: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  schedulePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
  },
  moreSchedules: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Empty state styles
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModal: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },

  // Prescription info styles
  prescriptionInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  prescriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  prescriptionDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  prescriptionNotes: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },

  // Schedule styles
  schedulesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  schedulePattern: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scheduleNotification: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },

  // Edit form styles
  editForm: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  selectedOptionText: {
    color: Colors.white,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    padding: 4,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // Create form styles
  dropdownContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    maxHeight: 200,
  },
  dropdownPlaceholder: {
    padding: 12,
    fontSize: 16,
    color: Colors.textMuted,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  medicineDropdown: {
    maxHeight: 150,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  // Date picker styles
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  datePickerModal: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  dateList: {
    maxHeight: 300,
  },
  dateOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedDateOption: {
    backgroundColor: Colors.primary,
  },
  dateOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  selectedDateText: {
    color: Colors.white,
    fontWeight: '600',
  },
  cancelDateButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelDateText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
