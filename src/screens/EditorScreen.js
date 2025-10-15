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
  Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import MedicationPicker from '../components/MedicationPicker';
import TimePicker from '../components/TimePicker';
import { addMedication, getAllMedications } from '../services/storage';
import { scheduleReminder, buildDateFromTime } from '../services/notifications';
import dayjs from 'dayjs';

export default function EditorScreen({ navigation }) {
  const [selectedMeds, setSelectedMeds] = useState([{ med: null, dosage: '', quantity: '1' }]);
  const [times, setTimes] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [medicationCount, setMedicationCount] = useState(0);

  const loadMedicationCount = async () => {
    try {
      const medications = await getAllMedications();
      setMedicationCount(medications.length);
    } catch (error) {
      console.log('Error loading medication count:', error);
    }
  };

  useEffect(() => {
    loadMedicationCount();
    
    // Listen for navigation focus to refresh count
    const unsubscribe = navigation.addListener('focus', () => {
      loadMedicationCount();
    });

    return unsubscribe;
  }, [navigation]);

  // Debug: Monitor selectedMeds changes
  useEffect(() => {
    console.log('=== selectedMeds state changed ===');
    console.log('New selectedMeds:', JSON.stringify(selectedMeds, null, 2));
  }, [selectedMeds]);

  const addMedicationSlot = () => {
    // Kiểm tra nếu đã có 2 thuốc thì hiển thị premium modal
    if (selectedMeds.length >= 2) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedMeds([...selectedMeds, { med: null, dosage: '', quantity: '1' }]);
  };

  const updateMedication = (index, field, value) => {
    console.log(`=== updateMedication ===`);
    console.log(`Index: ${index}, Field: ${field}`);
    console.log('Value:', value);
    
    setSelectedMeds(prevMeds => {
      console.log('Previous selectedMeds:', prevMeds);
      const newMeds = [...prevMeds];
      newMeds[index] = { ...newMeds[index], [field]: value };
      console.log('New selectedMeds after update:', newMeds);
      return newMeds;
    });
  };

  const removeMedication = (index) => {
    if (selectedMeds.length > 1) {
      setSelectedMeds(selectedMeds.filter((_, i) => i !== index));
    }
  };

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
    // Tìm thuốc đầu tiên chưa được chọn đầy đủ
    for (let i = 0; i < selectedMeds.length; i++) {
      const medItem = selectedMeds[i];
      
      // Bỏ qua các slot thuốc trống hoàn toàn
      if (!medItem.med && (!medItem.dosage || medItem.dosage.trim() === '') && (!medItem.quantity || medItem.quantity === '1')) {
        continue;
      }
      
      // Nếu có thông tin một phần thì phải đầy đủ
      if (!medItem.med) {
        Alert.alert('Thông tin chưa đầy đủ', `Vui lòng chọn loại thuốc cho "Thuốc ${i + 1}"`);
        return false;
      }
      
      if (!medItem.dosage || medItem.dosage.trim() === '') {
        Alert.alert('Thông tin chưa đầy đủ', `Vui lòng nhập liều lượng cho "${medItem.med.name}"`);
        return false;
      }
      
      if (!medItem.quantity || medItem.quantity.trim() === '' || isNaN(parseInt(medItem.quantity)) || parseInt(medItem.quantity) < 1) {
        Alert.alert('Thông tin chưa đầy đủ', `Vui lòng nhập số lượng hợp lệ cho "${medItem.med.name}"`);
        return false;
      }
    }

    // Kiểm tra có ít nhất một thuốc hoàn chỉnh
    const completeMedications = selectedMeds.filter(medItem => 
      medItem.med && 
      medItem.dosage && 
      medItem.dosage.trim() !== '' && 
      medItem.quantity && 
      medItem.quantity.trim() !== '' && 
      !isNaN(parseInt(medItem.quantity)) && 
      parseInt(medItem.quantity) > 0
    );

    if (completeMedications.length === 0) {
      Alert.alert('Thông tin chưa đầy đủ', 'Vui lòng chọn ít nhất một loại thuốc và nhập đầy đủ thông tin');
      return false;
    }

    // Check times
    const validTimes = times.filter(time => time && time.trim() !== '');
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
      const validMeds = selectedMeds.filter(item => item.med && item.dosage.trim() && item.quantity.trim());
      
      // Save each medication separately
      let savedCount = 0;
      for (const medItem of validMeds) {
        const medication = {
          name: medItem.med.name,
          dosage: medItem.dosage.trim(),
          times: validTimes.map(time => ({
            time,
            quantity: parseInt(medItem.quantity),
            status: 'pending'
          }))
        };

        const result = await addMedication(medication);
        if (result.success) {
          savedCount++;
          // Lên lịch thông báo cho từng mốc giờ
          for (const timeSlot of validTimes) {
            const today = dayjs();
            const notificationDate = buildDateFromTime(today.toDate(), timeSlot);
            
            // Chỉ đặt thông báo cho tương lai
            if (notificationDate.getTime() > Date.now()) {
              await scheduleReminder({
                title: `Nhắc uống: ${medItem.med.name}`,
                body: `${medItem.dosage.trim()}, uống ${medItem.quantity} viên lúc ${timeSlot}`,
                date: notificationDate,
              });
            }
          }
        }
      }

      if (savedCount > 0) {
        Alert.alert(
          '✅ Thành công!', 
          `Đã thêm ${savedCount} loại thuốc với ${validTimes.length} mốc giờ nhắc nhở!`,
          [{ 
            text: 'OK', 
            onPress: () => {
              resetForm();
              loadMedicationCount(); // Refresh count
              // Navigate back to Home and trigger reload
              navigation.navigate('Trang chủ', { shouldReload: true });
            }
          }]
        );
      } else {
        throw new Error('Không thể lưu thuốc nào');
      }
    } catch (error) {
      Alert.alert('⚠️ Có lỗi xảy ra', error.message || 'Không thể lưu thuốc. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedMeds([{ med: null, dosage: '', quantity: '1' }]);
    setTimes(['']);
  };

  const handlePremiumUpgrade = () => {
    setShowPremiumModal(false);
    Alert.alert(
      'Nâng cấp Premium',
      'Tính năng nâng cấp Premium sẽ được phát triển trong phiên bản tiếp theo.',
      [{ text: 'OK' }]
    );
  };

  const handlePremiumCancel = () => {
    setShowPremiumModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Thêm nhắc nhở mới</Text>
            <Text style={styles.medicationCounter}>
              {medicationCount}/3 thuốc {medicationCount >= 3 && '(Giới hạn miễn phí)'}
            </Text>
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={resetForm}>
            <Ionicons name="refresh-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chọn thuốc cần nhắc nhở</Text>
            <Text style={styles.hintText}>💡 Nhấn vào "Chọn thuốc" để tìm và chọn thuốc từ danh sách</Text>
            {selectedMeds.map((medItem, index) => (
              <View key={index} style={styles.medicationRow}>
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationLabel}>Thuốc {index + 1}</Text>
                  {selectedMeds.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeMedBtn} 
                      onPress={() => removeMedication(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={Colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.medicationPickerContainer}>
                  <MedicationPicker 
                    selectedMed={medItem.med} 
                    onSelect={(med) => {
                      console.log('=== EditorScreen onSelect ===');
                      console.log('Received medicine:', med);
                      console.log('Index:', index);
                      
                      // Update both medication and dosage in one batch
                      setSelectedMeds(prevMeds => {
                        const newMeds = [...prevMeds];
                        const currentItem = newMeds[index];
                        
                        // Set the medication
                        newMeds[index] = { ...currentItem, med: med };
                        
                        // Auto-fill dosage if empty
                        if (!currentItem.dosage || currentItem.dosage.trim() === '') {
                          if (med.strength) {
                            console.log('Auto-filling dosage with strength:', med.strength);
                            newMeds[index].dosage = med.strength;
                          } else if (med.dosages && med.dosages.length > 0) {
                            console.log('Auto-filling dosage with first dosage:', med.dosages[0]);
                            newMeds[index].dosage = med.dosages[0];
                          }
                        }
                        
                        console.log('Updated item:', newMeds[index]);
                        return newMeds;
                      });
                    }} 
                  />
                  {medItem.med && (
                    <View style={styles.selectedMedIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      <Text style={styles.selectedMedText}>Đã chọn: {medItem.med.name}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.dosageQuantityRow}>
                  <View style={styles.dosageContainer}>
                    <Text style={styles.subLabel}>Liều lượng</Text>
                    <TextInput
                      style={styles.dosageInput}
                      value={medItem.dosage || ''}
                      onChangeText={(text) => updateMedication(index, 'dosage', text)}
                      placeholder="Ví dụ: 500mg"
                    />
                    {medItem.med && medItem.med.dosages && medItem.med.dosages.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dosageOptions}>
                        {medItem.med.dosages.map((d, i) => (
                          <TouchableOpacity 
                            key={i} 
                            style={[styles.dosageChip, medItem.dosage === d && styles.selectedDosageChip]}
                            onPress={() => updateMedication(index, 'dosage', d)}
                          >
                            <Text style={[styles.dosageChipText, medItem.dosage === d && styles.selectedDosageText]}>
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
                      value={medItem.quantity || '1'}
                      onChangeText={(text) => updateMedication(index, 'quantity', text)}
                      placeholder="1"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {medItem.med && (
                  <View style={styles.medicineDetails}>
                    <Text style={styles.medicineDetailText}>
                      Loại: {medItem.med.type} • Danh mục: {medItem.med.category}
                    </Text>
                    {medItem.med.notes && (
                      <Text style={styles.medicineNotes} numberOfLines={2}>
                        Ghi chú: {medItem.med.notes}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
            
            <TouchableOpacity style={[styles.addMedBtn, selectedMeds.length >= 2 && styles.addMedBtnPremium]} onPress={addMedicationSlot}>
              <Ionicons 
                name={selectedMeds.length >= 2 ? "diamond" : "add-circle-outline"} 
                size={20} 
                color={selectedMeds.length >= 2 ? Colors.accent : Colors.primaryDark} 
              />
              <Text style={[styles.addMedText, selectedMeds.length >= 2 && styles.addMedTextPremium]}>
                {selectedMeds.length >= 2 ? "Nâng cấp Premium để thêm thuốc" : "Thêm thuốc khác"}
              </Text>
            </TouchableOpacity>
            
            {selectedMeds.length >= 2 && (
              <Text style={styles.premiumHint}>
                💎 Miễn phí: tối đa 2 loại thuốc • Premium: không giới hạn
              </Text>
            )}
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

      {/* Premium Modal */}
      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.premiumModal}>
            <View style={styles.premiumHeader}>
              <Ionicons name="diamond" size={48} color={Colors.accent} />
              <Text style={styles.premiumTitle}>Nâng cấp lên Premium</Text>
            </View>
            
            <View style={styles.premiumContent}>
              <Text style={styles.premiumText}>
                Bạn đã đạt giới hạn miễn phí (2 loại thuốc). Nâng cấp lên Premium để thêm nhiều thuốc hơn:
              </Text>
              
              <View style={styles.premiumFeatures}>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.featureText}>Thêm không giới hạn số loại thuốc</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.featureText}>Đồng bộ dữ liệu trên nhiều thiết bị</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.featureText}>Báo cáo chi tiết về việc uống thuốc</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.featureText}>Hỗ trợ khách hàng ưu tiên</Text>
                </View>
              </View>
            </View>

            <View style={styles.premiumActions}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={handlePremiumCancel}
              >
                <Text style={styles.cancelBtnText}>Để sau</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.upgradeBtn}
                onPress={handlePremiumUpgrade}
              >
                <Text style={styles.upgradeBtnText}>Nâng cấp ngay</Text>
              </TouchableOpacity>
            </View>
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
  medicationCounter: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  resetBtn: { padding: 8 },
  form: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  hintText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
    fontStyle: 'italic',
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
  dosageContainer: { 
    flex: 2,
    gap: 12 
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
  // Multiple medication styles
  medicationRow: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  removeMedBtn: {
    padding: 4,
  },
  medicationPickerContainer: {
    marginBottom: 8,
  },
  selectedMedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(47, 167, 122, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  selectedMedText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  dosageQuantityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quantityContainer: {
    flex: 1,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
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
  addMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    borderRadius: 12,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addMedText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  addMedBtnPremium: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  addMedTextPremium: {
    color: Colors.accent,
  },
  premiumHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
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
  // Premium Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  premiumModal: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  premiumContent: {
    marginBottom: 24,
  },
  premiumText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  premiumFeatures: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  premiumActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  upgradeBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
