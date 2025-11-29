import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getAllMedications, saveMedication } from '../services/storage';
import { fetchMedicinesFromBackend, fetchAllMedicinesFromBackend, searchMedicinesFromBackend, addMedicineToBackend } from '../services/medicationsApi';

// Constants for dropdowns
const MEDICINE_TYPES = [
  { label: 'Viên nén', value: 'TABLET' },
  { label: 'Viên nang', value: 'CAPSULE' },
  { label: 'Siro uống', value: 'SYRUP' },
  { label: 'Dung dịch uống/tiêm', value: 'SOLUTION' },
  { label: 'Hỗn dịch (huyền dịch)', value: 'SUSPENSION' },
  { label: 'Bột hòa tan', value: 'POWDER' },
  { label: 'Gói bột (sachet)', value: 'SACHET' },
  { label: 'Thuốc tiêm (chung)', value: 'INJECTION' },
  { label: 'Ống tiêm (ampoule)', value: 'AMPULE' },
  { label: 'Lọ thuốc tiêm (vial)', value: 'VIAL' },
  { label: 'Thuốc nhỏ mắt', value: 'EYE_DROPS' },
  { label: 'Thuốc nhỏ tai', value: 'EAR_DROPS' },
  { label: 'Thuốc xịt mũi', value: 'NASAL_SPRAY' },
  { label: 'Thuốc hít', value: 'INHALER' },
  { label: 'Thuốc mỡ', value: 'OINTMENT' },
  { label: 'Kem bôi', value: 'CREAM' },
  { label: 'Gel bôi', value: 'GEL' },
  { label: 'Miếng dán', value: 'PATCH' },
  { label: 'Thuốc đặt (âm đạo/hậu môn)', value: 'SUPPOSITORY' },
  { label: 'Khác', value: 'OTHER' }
];

const STRENGTH_UNITS = [
  { label: 'mg', value: 'MG' },
  { label: 'g', value: 'G' },
  { label: 'mcg (µg)', value: 'MCG' },
  { label: 'IU (đơn vị quốc tế)', value: 'IU' },
  { label: 'Unit (đơn vị chung)', value: 'UNIT' },
  { label: 'ml', value: 'ML' },
  { label: 'L', value: 'L' },
  { label: 'giọt', value: 'DROPS' },
  { label: 'viên', value: 'TABLET' },
  { label: 'viên nang', value: 'CAPSULE' },
  { label: 'miếng dán', value: 'PATCH' },
  { label: 'gói', value: 'SACHET' },
  { label: 'ống', value: 'AMPULE' },
  { label: 'lọ', value: 'VIAL' },
  { label: 'mg/ml', value: 'MG_PER_ML' },
  { label: 'mg/5ml', value: 'MG_PER_5ML' },
  { label: 'IU/ml', value: 'IU_PER_ML' },
  { label: '%', value: 'PERCENT' },
  { label: 'Khác', value: 'OTHER' }
];

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [userMedications, setUserMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendMedicines, setBackendMedicines] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    strengthvalue: '',
    type: 'TABLET',
    strengthUnit: 'MG',
    imageurl: '',
    notes: ''
  });
  const [addingMedicine, setAddingMedicine] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showMedicineDetail, setShowMedicineDetail] = useState(false);
  const [selectedMedicineDetail, setSelectedMedicineDetail] = useState(null);

  useEffect(() => {
    loadUserMedications();
    loadPopularMedicines();
  }, []);

  const loadUserMedications = async () => {
    try {
      const medications = await getAllMedications();
      setUserMedications(medications);
    } catch (error) {
      console.log('Error loading medications:', error);
    }
  };

  const loadPopularMedicines = async () => {
    try {
      setLoading(true);
      console.log('Loading all medicines from backend...');
      
      // Load ALL pages from backend
      const result = await fetchAllMedicinesFromBackend(50); // 50 items per page
      
      if (result.success) {
        console.log(`✅ Loaded ${result.medicines.length} medicines from backend`);
        setBackendMedicines(result.medicines);
        setFilteredMedications(result.medicines);
      } else {
        console.log('Error loading medicines from backend:', result.error);
        Alert.alert('Lỗi', result.error || 'Không thể tải danh sách thuốc');
        setFilteredMedications([]);
      }
    } catch (error) {
      console.log('Error loading popular medicines:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải danh sách thuốc');
      setFilteredMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const resetNewMedicineForm = () => {
    setNewMedicine({
      name: '',
      strengthvalue: '',
      type: 'TABLET',
      strengthUnit: 'MG',
      imageurl: '',
      notes: ''
    });
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thuốc');
      return;
    }
    if (!newMedicine.strengthvalue.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập hàm lượng thuốc');
      return;
    }

    setAddingMedicine(true);
    try {
      const medicineData = {
        ...newMedicine,
        strengthvalue: parseFloat(newMedicine.strengthvalue)
      };

      const result = await addMedicineToBackend(medicineData);
      if (result.success) {
        Alert.alert('Thành công', 'Đã thêm thuốc mới thành công!');
        setShowAddMedicineModal(false);
        resetNewMedicineForm();
        // Reload medicines list
        loadPopularMedicines();
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể thêm thuốc mới');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi thêm thuốc mới');
    } finally {
      setAddingMedicine(false);
    }
  };

  const handleSearch = async (text) => {
    setSearchText(text);
    
    if (text.trim() === '') {
      setFilteredMedications(backendMedicines);
      return;
    }

    setLoading(true);
    try {
      // Search from backend API
      const result = await searchMedicinesFromBackend(text.trim());
      if (result.success) {
        // Combine backend results with user medications
        const userMedsFiltered = userMedications
          .filter(med => med.name.toLowerCase().includes(text.toLowerCase()))
          .map(med => ({
            id: med.id,
            name: med.name,
            category: 'Thuốc của bạn',
            isUserMed: true
          }));

        const allResults = [...userMedsFiltered, ...result.medicines];
        setFilteredMedications(allResults);
      } else {
        // Fallback to local search
        const userMedsFiltered = userMedications
          .filter(med => med.name.toLowerCase().includes(text.toLowerCase()))
          .map(med => ({
            id: med.id,
            name: med.name,
            category: 'Thuốc của bạn',
            isUserMed: true
          }));
        setFilteredMedications(userMedsFiltered);
      }
    } catch (error) {
      console.log('Search error:', error);
      // Fallback to local search
      const userMedsFiltered = userMedications
        .filter(med => med.name.toLowerCase().includes(text.toLowerCase()))
        .map(med => ({
          id: med.id,
          name: med.name,
          category: 'Thuốc của bạn',
          isUserMed: true
        }));
      setFilteredMedications(userMedsFiltered);
    } finally {
      setLoading(false);
    }
  };

  const addToRecentSearches = (searchTerm) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(term => term !== searchTerm);
      return [searchTerm, ...filtered].slice(0, 5); // Keep only 5 recent searches
    });
  };

  const clearSearch = () => {
    setSearchText('');
    setFilteredMedications(backendMedicines);
  };

  const selectMedication = (medication) => {
    addToRecentSearches(medication.name);
    setSelectedMedicineDetail(medication);
    setShowMedicineDetail(true);
  };

  const getTypeDisplayName = (type) => {
    const typeMap = {
      'TABLET': 'Viên nén',
      'CAPSULE': 'Viên nang',
      'SYRUP': 'Siro uống',
      'SOLUTION': 'Dung dịch uống/tiêm',
      'SUSPENSION': 'Hỗn dịch (huyền dịch)',
      'POWDER': 'Bột hòa tan',
      'SACHET': 'Gói bột (sachet)',
      'INJECTION': 'Thuốc tiêm (chung)',
      'AMPULE': 'Ống tiêm (ampoule)',
      'VIAL': 'Lọ thuốc tiêm (vial)',
      'EYE_DROPS': 'Thuốc nhỏ mắt',
      'EAR_DROPS': 'Thuốc nhỏ tai',
      'NASAL_SPRAY': 'Thuốc xịt mũi',
      'INHALER': 'Thuốc hít',
      'OINTMENT': 'Thuốc mỡ',
      'CREAM': 'Kem bôi',
      'GEL': 'Gel bôi',
      'PATCH': 'Miếng dán',
      'SUPPOSITORY': 'Thuốc đặt (âm đạo/hậu môn)',
      'OTHER': 'Khác'
    };
    return typeMap[type] || type;
  };

  const getUnitDisplayName = (unit) => {
    const unitMap = {
      'MG': 'mg',
      'G': 'g',
      'MCG': 'mcg (µg)',
      'IU': 'IU (đơn vị quốc tế)',
      'UNIT': 'Unit (đơn vị chung)',
      'ML': 'ml',
      'L': 'L',
      'DROPS': 'giọt',
      'TABLET': 'viên',
      'CAPSULE': 'viên nang',
      'PATCH': 'miếng dán',
      'SACHET': 'gói',
      'AMPULE': 'ống',
      'VIAL': 'lọ',
      'MG_PER_ML': 'mg/ml',
      'MG_PER_5ML': 'mg/5ml',
      'IU_PER_ML': 'IU/ml',
      'PERCENT': '%',
      'OTHER': 'khác'
    };
    return unitMap[unit] || unit;
  };

  const checkPremiumLimit = async () => {
    const medications = await getAllMedications();
    return medications.length >= 3;
  };

  const addMedicationToReminder = async (medication) => {
    try {
      // Check if user has reached the 3-medication limit
      const reachedLimit = await checkPremiumLimit();
      
      if (reachedLimit) {
        setSelectedMedication(medication);
        setShowPremiumModal(true);
        return;
      }

      // Check if medication already exists
      const existingMedications = await getAllMedications();
      const exists = existingMedications.some(med => 
        med.name.toLowerCase() === medication.name.toLowerCase()
      );

      if (exists) {
        Alert.alert(
          'Thông báo',
          'Thuốc này đã có trong danh sách nhắc nhở của bạn.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Create new medication object
      const newMedication = {
        id: Date.now().toString(),
        name: medication.name,
        dosage: medication.strength || '1 viên',
        time: '08:00',
        days: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
        createdAt: new Date().toISOString(),
      };

      await saveMedication(newMedication);
      
      Alert.alert(
        'Thành công!',
        `Đã thêm "${medication.name}" vào danh sách nhắc nhở.\n\nBạn có thể chỉnh sửa liều lượng và thời gian trong tab "Thêm".`,
        [{ text: 'OK' }]
      );

      // Reload user medications
      loadUserMedications();
      
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm thuốc vào nhắc nhở. Vui lòng thử lại.');
    }
  };

  const handlePremiumUpgrade = () => {
    setShowPremiumModal(false);
    Alert.alert(
      'Premium',
      'Chức năng nâng cấp Premium sẽ được phát triển trong phiên bản tiếp theo.',
      [{ text: 'OK' }]
    );
  };

  const handlePremiumCancel = () => {
    setShowPremiumModal(false);
    setSelectedMedication(null);
  };

  const renderMedicationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.medicationItem}
      onPress={() => selectMedication(item)}
    >
      <View style={styles.medicationIcon}>
        <Ionicons 
          name={item.isUserMed ? "heart" : "medical"} 
          size={20} 
          color={item.isUserMed ? Colors.accent : Colors.primary} 
        />
      </View>
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{item.name}</Text>
        <Text style={styles.medicationCategory}>{item.category}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleSearch(item)}
    >
      <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header với gradient */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tìm kiếm thuốc</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddMedicineModal(true)}
          >
            <Ionicons name="add-circle-outline" size={28} color={Colors.white} />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm thuốc..."
              placeholderTextColor={Colors.textSecondary}
              value={searchText}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Recent Searches */}
        {recentSearches.length > 0 && searchText === '' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
            <FlatList
              data={recentSearches}
              renderItem={renderRecentSearch}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentSearchList}
            />
          </View>
        )}

        {/* Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchText ? `Kết quả tìm kiếm (${filteredMedications.length})` : 'Danh sách thuốc từ hệ thống'}
          </Text>
          <FlatList
            data={filteredMedications}
            renderItem={renderMedicationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>Không tìm thấy thuốc nào</Text>
                <Text style={styles.emptySubtext}>Thử tìm kiếm với từ khóa khác</Text>
              </View>
            }
          />
        </View>
      </View>
        {/* Medicine Detail Modal */}
        <Modal
          visible={showMedicineDetail}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.detailModalContainer}>
            <View style={styles.detailModalHeader}>
              <TouchableOpacity 
                onPress={() => setShowMedicineDetail(false)}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.detailModalTitle}>Chi tiết thuốc</Text>
              <TouchableOpacity 
                style={styles.addToReminderButton}
                onPress={() => {
                  addMedicationToReminder(selectedMedicineDetail);
                  setShowMedicineDetail(false);
                }}
              >
                <Text style={styles.addToReminderButtonText}>Thêm vào nhắc nhở</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>
              {selectedMedicineDetail && (
                <>
                  {/* Hình ảnh thuốc */}
                  {(selectedMedicineDetail.imageUrl || selectedMedicineDetail.imageurl) && (
                    <View style={styles.medicineImageContainer}>
                      <Image 
                        source={{ uri: selectedMedicineDetail.imageUrl || selectedMedicineDetail.imageurl }}
                        style={styles.medicineImage}
                        resizeMode="cover"
                        onError={() => console.log('Failed to load medicine image')}
                      />
                    </View>
                  )}

                  {/* Thông tin cơ bản */}
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Thông tin cơ bản</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ID thuốc:</Text>
                      <Text style={styles.detailValue}>#{selectedMedicineDetail.id}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tên thuốc:</Text>
                      <Text style={styles.detailValue}>{selectedMedicineDetail.name}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Hàm lượng:</Text>
                      <Text style={styles.detailValue}>
                        {selectedMedicineDetail.strength || 
                         (selectedMedicineDetail.strengthvalue && selectedMedicineDetail.strengthUnit ? 
                          `${selectedMedicineDetail.strengthvalue} ${getUnitDisplayName(selectedMedicineDetail.strengthUnit)}` : 
                          'Chưa có thông tin')}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Dạng bào chế:</Text>
                      <Text style={styles.detailValue}>
                        {selectedMedicineDetail.type ? getTypeDisplayName(selectedMedicineDetail.type) : 'Chưa có thông tin'}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Danh mục:</Text>
                      <Text style={styles.detailValue}>{selectedMedicineDetail.category}</Text>
                    </View>
                  </View>

                  {/* Ghi chú và hướng dẫn */}
                  {selectedMedicineDetail.notes && (
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardTitle}>Ghi chú & Hướng dẫn sử dụng</Text>
                      <Text style={styles.notesText}>{selectedMedicineDetail.notes}</Text>
                    </View>
                  )}

              

                  {/* Spacer */}
                  <View style={{ height: 20 }} />
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Add Medicine Modal */}
        <Modal
          visible={showAddMedicineModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowAddMedicineModal(false);
                  resetNewMedicineForm();
                }}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Thêm thuốc mới</Text>
              <TouchableOpacity 
                style={[styles.saveButton, addingMedicine && styles.saveButtonDisabled]}
                onPress={handleAddMedicine}
                disabled={addingMedicine}
              >
                <Text style={styles.saveButtonText}>
                  {addingMedicine ? 'Đang lưu...' : 'Lưu'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={() => {
                setShowTypeDropdown(false);
                setShowUnitDropdown(false);
              }}
            >
              {/* Tên thuốc */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên thuốc *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMedicine.name}
                  onChangeText={(text) => setNewMedicine(prev => ({ ...prev, name: text }))}
                  placeholder="Nhập tên thuốc"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Hàm lượng */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hàm lượng *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMedicine.strengthvalue}
                  onChangeText={(text) => setNewMedicine(prev => ({ ...prev, strengthvalue: text }))}
                  placeholder="Ví dụ: 500"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Đơn vị hàm lượng */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Đơn vị hàm lượng</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdown}
                    onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                  >
                    <Text style={styles.dropdownText}>
                      {STRENGTH_UNITS.find(unit => unit.value === newMedicine.strengthUnit)?.label || 'mg'}
                    </Text>
                    <Ionicons 
                      name={showUnitDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={Colors.textMuted} 
                    />
                  </TouchableOpacity>
                  {showUnitDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView 
                        style={styles.dropdownScrollView}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        {STRENGTH_UNITS.map(unit => (
                          <TouchableOpacity
                            key={unit.value}
                            style={[
                              styles.dropdownItem,
                              newMedicine.strengthUnit === unit.value && styles.dropdownItemSelected
                            ]}
                            onPress={() => {
                              setNewMedicine(prev => ({ ...prev, strengthUnit: unit.value }));
                              setShowUnitDropdown(false);
                            }}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              newMedicine.strengthUnit === unit.value && styles.dropdownItemTextSelected
                            ]}>
                              {unit.label}
                            </Text>
                            {newMedicine.strengthUnit === unit.value && (
                              <Ionicons name="checkmark" size={20} color={Colors.primaryDark} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Dạng bào chế */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dạng bào chế</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdown}
                    onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                  >
                    <Text style={styles.dropdownText}>
                      {MEDICINE_TYPES.find(type => type.value === newMedicine.type)?.label || 'Viên nén'}
                    </Text>
                    <Ionicons 
                      name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={Colors.textMuted} 
                    />
                  </TouchableOpacity>
                  {showTypeDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView 
                        style={styles.dropdownScrollView}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        {MEDICINE_TYPES.map(type => (
                          <TouchableOpacity
                            key={type.value}
                            style={[
                              styles.dropdownItem,
                              newMedicine.type === type.value && styles.dropdownItemSelected
                            ]}
                            onPress={() => {
                              setNewMedicine(prev => ({ ...prev, type: type.value }));
                              setShowTypeDropdown(false);
                            }}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              newMedicine.type === type.value && styles.dropdownItemTextSelected
                            ]}>
                              {type.label}
                            </Text>
                            {newMedicine.type === type.value && (
                              <Ionicons name="checkmark" size={20} color={Colors.primaryDark} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* URL hình ảnh */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>URL hình ảnh</Text>
                <TextInput
                  style={styles.textInput}
                  value={newMedicine.imageurl}
                  onChangeText={(text) => setNewMedicine(prev => ({ ...prev, imageurl: text }))}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Ghi chú */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ghi chú</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newMedicine.notes}
                  onChangeText={(text) => setNewMedicine(prev => ({ ...prev, notes: text }))}
                  placeholder="Thông tin thêm về thuốc..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 15,
  },
  recentSearchList: {
    marginBottom: 10,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  recentSearchText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 5,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  medicationCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  dropdownList: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    maxHeight: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.surface,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  // Detail Modal styles
  detailModalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addToReminderButton: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addToReminderButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  detailModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  medicineImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  medicineImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  urlText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 2,
    textAlign: 'right',
    fontStyle: 'italic',
  },
});
