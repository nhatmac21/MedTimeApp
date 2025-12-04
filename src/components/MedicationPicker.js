import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { fetchAllMedicinesFromBackend } from '../services/medicationsApi';

export default function MedicationPicker({ onSelect, selectedMed }) {
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);
  const [allMedicines, setAllMedicines] = useState([]); // Full list from backend
  const [displayedMedicines, setDisplayedMedicines] = useState([]); // Filtered list for display
  const [loading, setLoading] = useState(false);

  // Load ALL medicines on mount
  useEffect(() => {
    loadAllMedicines();
  }, []);

  // Filter medicines locally when search text changes
  useEffect(() => {
    filterMedicines(search);
  }, [search, allMedicines]);

  const loadAllMedicines = async () => {
    setLoading(true);
    try {
      console.log('MedicationPicker: Loading all medicines...');
      const result = await fetchAllMedicinesFromBackend(50);
      
      if (result.success) {
        console.log(`MedicationPicker: Loaded ${result.medicines.length} medicines`);
        setAllMedicines(result.medicines);
        setDisplayedMedicines(result.medicines); // Show all initially
      } else {
        console.error('Failed to load medicines:', result.error);
      }
    } catch (error) {
      console.error('Error loading medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMedicines = (searchText) => {
    if (!searchText || searchText.trim() === '') {
      // No search text -> show all medicines
      setDisplayedMedicines(allMedicines);
      return;
    }

    // Filter medicines by name (case-insensitive)
    const searchLower = searchText.toLowerCase().trim();
    const filtered = allMedicines.filter(med => 
      med.name.toLowerCase().includes(searchLower)
    );
    
    console.log(`MedicationPicker: Filtered ${filtered.length} medicines for "${searchText}"`);
    setDisplayedMedicines(filtered);
  };

  const handleSelect = (med) => {
    console.log('=== MedicationPicker handleSelect ===');
    console.log('Selected medicine:', med);
    console.log('onSelect callback exists:', !!onSelect);
    
    // Transform backend data to match EditorScreen expectations
    const transformedMed = {
      medicineid: med.id, // Add medicineid for API compatibility
      id: med.id,
      name: med.name,
      strength: med.strength,
      type: med.type,
      category: med.category,
      dosages: [med.strength], // Use strength as default dosage
      imageUrl: med.imageUrl,
      notes: med.notes,
      strengthvalue: med.strengthvalue,
      strengthUnit: med.strengthUnit
    };
    
    console.log('Transformed medicine:', transformedMed);
    
    if (onSelect) {
      onSelect(transformedMed);
      console.log('onSelect called successfully');
    } else {
      console.error('onSelect callback is missing!');
    }
    
    // Clear search and close modal
    setSearch('');
    setShowList(false);
    // Reset to full list
    setDisplayedMedicines(allMedicines);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chọn thuốc</Text>
      <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowList(true)}>
        <TextInput
          style={styles.input}
          value={selectedMed ? selectedMed.name : search}
          onChangeText={setSearch}
          placeholder="Tìm tên thuốc..."
          onFocus={() => setShowList(true)}
          editable={!selectedMed}
        />
        {selectedMed && (
          <TouchableOpacity
            onPress={() => {
              onSelect(null);
              setSearch('');
              setDisplayedMedicines(allMedicines);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
      
      <Modal visible={showList} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn thuốc</Text>
              <TouchableOpacity onPress={() => {
                setShowList(false);
                setSearch('');
                setDisplayedMedicines(allMedicines);
              }}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            {/* Search input inside modal */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm tên thuốc..."
                placeholderTextColor={Colors.textMuted}
                autoFocus={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearch('');
                  setDisplayedMedicines(allMedicines);
                }}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.resultCount}>
              {displayedMedicines.length} thuốc {search && `(tìm kiếm: "${search}")`}
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.loadingText}>Đang tải danh sách thuốc...</Text>
              </View>
            ) : (
              <FlatList
                data={displayedMedicines}
                keyExtractor={item => item.id}
                style={styles.modalList}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.option, selectedMed?.id === item.id && styles.selectedOption]} 
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.medicineInfo}>
                      <Text style={[styles.optionText, selectedMed?.id === item.id && styles.selectedText]}>
                        {item.name}
                      </Text>
                      <Text style={styles.strengthText}>
                        {item.strength} • {item.category}
                      </Text>
                      {item.notes && (
                        <Text style={styles.notesText} numberOfLines={1}>
                          {item.notes}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>Không tìm thấy thuốc nào</Text>
                    {search && (
                      <Text style={styles.emptyHint}>Thử tìm kiếm với từ khóa khác</Text>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.card, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border
  },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  clearButton: {
    marginRight: 8,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContainer: { 
    backgroundColor: Colors.card, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '70%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border 
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  resultCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  modalList: { maxHeight: 400 },
  option: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectedOption: { backgroundColor: Colors.surface },
  medicineInfo: { flex: 1 },
  optionText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  selectedText: { color: Colors.primaryDark },
  strengthText: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  notesText: { fontSize: 11, color: Colors.textMuted, marginTop: 1, fontStyle: 'italic' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: Colors.textMuted },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 16, marginTop: 12, fontWeight: '500' },
  emptyHint: { color: Colors.textMuted, fontSize: 14, marginTop: 4 },
});