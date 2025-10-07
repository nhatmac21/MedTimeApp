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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getAllMedications, saveMedication } from '../services/storage';
import { fetchMedicinesFromBackend, searchMedicinesFromBackend } from '../services/medicationsApi';

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [userMedications, setUserMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendMedicines, setBackendMedicines] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);

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
      const result = await fetchMedicinesFromBackend(1, 20);
      if (result.success) {
        setBackendMedicines(result.medicines);
        setFilteredMedications(result.medicines);
      } else {
        console.log('Error loading medicines from backend:', result.error);
        setFilteredMedications([]);
      }
    } catch (error) {
      console.log('Error loading popular medicines:', error);
      setFilteredMedications([]);
    } finally {
      setLoading(false);
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
    Alert.alert(
      'Thông tin thuốc',
      `${medication.name}\nDanh mục: ${medication.category}`,
      [
        {
          text: 'Đóng',
          style: 'cancel'
        },
        {
          text: 'Thêm vào nhắc nhở',
          onPress: () => addMedicationToReminder(medication)
        }
      ]
    );
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
    alignItems: 'center',
    marginBottom: 20,
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
});
