import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getPrescriptions, getMedicines, createPrescription, deletePrescription } from '../services/auth';

export default function EditorScreen({ navigation }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicineMap, setMedicineMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);

  const [createForm, setCreateForm] = useState({
    medicineid: '',
    dosage: '',
    frequencyperday: 1,
    startdate: new Date().toISOString().split('T')[0],
    enddate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
      setCurrentPage(1);
      setHasMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const medicinesResult = await getMedicines(1, 100);
      if (medicinesResult.success) {
        const medicinesList = medicinesResult.data.items || [];
        setMedicines(medicinesList);
        
        const mapping = {};
        medicinesList.forEach(medicine => {
          mapping[medicine.medicineid] = medicine.name;
        });
        setMedicineMap(mapping);
      }

      const prescriptionsResult = await getPrescriptions(1, 20);
      if (prescriptionsResult.success) {
        const newPrescriptions = prescriptionsResult.data.items || [];
        setPrescriptions(newPrescriptions);
        setHasMore(newPrescriptions.length >= 20);
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const prescriptionsResult = await getPrescriptions(nextPage, 20);
      
      if (prescriptionsResult.success) {
        const newPrescriptions = prescriptionsResult.data.items || [];
        
        if (newPrescriptions.length > 0) {
          setPrescriptions(prev => [...prev, ...newPrescriptions]);
          setCurrentPage(nextPage);
          setHasMore(newPrescriptions.length >= 20);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.log('Error loading more data:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getMedicineName = (medicineId) => {
    const medicine = medicines.find(m => m.medicineid.toString() === medicineId);
    return medicine ? medicine.name : `Thuốc ID: ${medicineId}`;
  };

  const handleStartDateChange = (selectedDate) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (selectedDate < today) {
      Alert.alert('Lỗi', 'Ngày bắt đầu phải là hôm nay hoặc trong tương lai');
      return;
    }
    
    setCreateForm(prev => {
      const newForm = { ...prev, startdate: selectedDate };
      if (prev.enddate < selectedDate) {
        newForm.enddate = selectedDate;
      }
      return newForm;
    });
  };

  const handleEndDateChange = (selectedDate) => {
    if (selectedDate < createForm.startdate) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu');
      return;
    }
    
    setCreateForm(prev => ({ ...prev, enddate: selectedDate }));
  };

  const handleCreatePrescription = async () => {
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
        remainingquantity: 2147483647,
        doctorname: "string",
        notes: createForm.notes.trim() || null
      };

      const result = await createPrescription(prescriptionData);

      if (result.success) {
        setShowCreateModal(false);
        setCreateForm({
          medicineid: '',
          dosage: '',
          frequencyperday: 1,
          startdate: new Date().toISOString().split('T')[0],
          enddate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        Alert.alert('Thành công', 'Đã tạo đơn thuốc thành công!');
        loadData();
      } else {
        Alert.alert('Lỗi', result.error);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo đơn thuốc');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrescription = (prescription) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa nhắc nhở "${medicineMap[prescription.medicineid] || 'thuốc này'}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deletePrescription(prescription.prescriptionid);
              if (result.success) {
                Alert.alert('Thành công', 'Đã xóa nhắc nhở thành công');
                loadData();
              } else {
                Alert.alert('Lỗi', result.error);
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa nhắc nhở');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderPrescriptionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.prescriptionCard}
      onPress={() => navigation.navigate('PrescriptionDetail', { prescription: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.medicineName}>
            {medicineMap[item.medicineid] || `Thuốc ID: ${item.medicineid}`}
          </Text>
          <Text style={styles.dosage}>{item.dosage}</Text>
        </View>
        <View style={styles.cardActions}>
          <View style={styles.frequencyBadge}>
            <Text style={styles.frequencyText}>{item.frequencyperday}x/ngày</Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeletePrescription(item)}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.dateText}>
            {new Date(item.startdate).toLocaleDateString('vi-VN')} - {new Date(item.enddate).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        
        {item.notes && (
          <View style={styles.notesRow}>
            <Ionicons name="document-text-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && medicines.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.title}>Thêm đơn thuốc</Text>
          <TouchableOpacity 
            style={styles.reloadButton}
            disabled={true}
          >
            <Ionicons 
              name="reload-outline" 
              size={24} 
              color={Colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.title}>Thêm đơn thuốc</Text>
        <TouchableOpacity 
          style={styles.reloadButton}
          onPress={() => loadData(true)}
          disabled={loading}
        >
          <Ionicons 
            name="reload-outline" 
            size={24} 
            color={loading ? Colors.textMuted : Colors.primary} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {prescriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={80} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Chưa có đơn thuốc nào</Text>
            <Text style={styles.emptyDescription}>
              Nhấn nút + để thêm đơn thuốc mới
            </Text>
          </View>
        ) : (
          <FlatList
            data={prescriptions}
            renderItem={renderPrescriptionItem}
            keyExtractor={(item) => item.prescriptionid.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreData}
            onEndReachedThreshold={0.3}
            ListFooterComponent={() => (
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
                </View>
              ) : null
            )}
          />
        )}
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => {
            setShowCreateModal(true);
            setShowMedicineDropdown(false);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thêm đơn thuốc mới</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Chọn thuốc *</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowMedicineDropdown(!showMedicineDropdown)}
                >
                  <Text style={[
                    styles.dropdownButtonText, 
                    !createForm.medicineid && styles.dropdownPlaceholderText
                  ]}>
                    {createForm.medicineid ? 
                      getMedicineName(createForm.medicineid) : 
                      'Chọn thuốc từ danh sách'
                    }
                  </Text>
                  <Ionicons 
                    name={showMedicineDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={Colors.textMuted} 
                  />
                </TouchableOpacity>
                
                {showMedicineDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.medicineDropdown} nestedScrollEnabled={true}>
                      {medicines.map((medicine) => (
                        <TouchableOpacity 
                          key={medicine.medicineid}
                          style={[
                            styles.medicineOption,
                            createForm.medicineid === medicine.medicineid.toString() && styles.selectedMedicineOption
                          ]}
                          onPress={() => {
                            setCreateForm({...createForm, medicineid: medicine.medicineid.toString()});
                            setShowMedicineDropdown(false);
                          }}
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
                )}
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

              {/* Nút Lưu */}
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleCreatePrescription}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Đang lưu...' : 'Lưu'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  container: { 
    flex: 1, 
    backgroundColor: Colors.surface 
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
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center'
  },
  reloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
  },
  headerLeft: {
    width: 40, // Same width as reload button to balance the layout
  },
  
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
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textMuted,
  },

  content: {
    flex: 1,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },

  listContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  
  prescriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  frequencyBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.error + '10',
  },
  cardContent: {
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 20,
  },

  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#ffffff',
  },
  placeholder: {
    width: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
  },
  
  form: {
    padding: 20,
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

  datePickerButton: {
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

  // Save button styles
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
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
});