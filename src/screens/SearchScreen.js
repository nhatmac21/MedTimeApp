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
import { getAllMedications } from '../services/storage';

// Mock data for popular medications
const popularMedications = [
  { id: '1', name: 'Paracetamol 500mg', category: 'Giảm đau, hạ sốt' },
  { id: '2', name: 'Amoxicillin 250mg', category: 'Kháng sinh' },
  { id: '3', name: 'Vitamin C 1000mg', category: 'Vitamin & khoáng chất' },
  { id: '4', name: 'Aspirin 100mg', category: 'Tim mạch' },
  { id: '5', name: 'Omeprazole 20mg', category: 'Dạ dày' },
  { id: '6', name: 'Metformin 500mg', category: 'Tiểu đường' },
  { id: '7', name: 'Losartan 50mg', category: 'Huyết áp' },
  { id: '8', name: 'Atorvastatin 20mg', category: 'Cholesterol' },
];

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [filteredMedications, setFilteredMedications] = useState(popularMedications);
  const [recentSearches, setRecentSearches] = useState([]);
  const [userMedications, setUserMedications] = useState([]);

  useEffect(() => {
    loadUserMedications();
  }, []);

  const loadUserMedications = async () => {
    try {
      const medications = await getAllMedications();
      setUserMedications(medications);
    } catch (error) {
      console.log('Error loading medications:', error);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    
    if (text.trim() === '') {
      setFilteredMedications(popularMedications);
      return;
    }

    // Combine user medications and popular medications for search
    const allMedications = [
      ...userMedications.map(med => ({
        id: med.id,
        name: med.name,
        category: 'Thuốc của bạn',
        isUserMed: true
      })),
      ...popularMedications
    ];

    const filtered = allMedications.filter(medication =>
      medication.name.toLowerCase().includes(text.toLowerCase()) ||
      medication.category.toLowerCase().includes(text.toLowerCase())
    );
    
    setFilteredMedications(filtered);
  };

  const addToRecentSearches = (searchTerm) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(term => term !== searchTerm);
      return [searchTerm, ...filtered].slice(0, 5); // Keep only 5 recent searches
    });
  };

  const clearSearch = () => {
    setSearchText('');
    setFilteredMedications(popularMedications);
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
          onPress: () => {
            // Navigate to editor with pre-filled medication name
            Alert.alert('Thông báo', 'Chức năng này sẽ được phát triển trong phiên bản sau');
          }
        }
      ]
    );
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
            {searchText ? `Kết quả tìm kiếm (${filteredMedications.length})` : 'Thuốc phổ biến'}
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
