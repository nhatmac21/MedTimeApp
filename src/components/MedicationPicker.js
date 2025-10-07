import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { fetchMedicinesFromBackend, searchMedicinesFromBackend } from '../services/medicationsApi';

export default function MedicationPicker({ onSelect, selectedMed }) {
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Load initial medicines data
  useEffect(() => {
    loadMedicines();
  }, []);

  // Search when user types
  useEffect(() => {
    if (search.trim().length >= 2) {
      searchMedicines(search.trim());
    } else {
      setSearchResults(medicines.slice(0, 20)); // Show first 20 items
    }
  }, [search, medicines]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const result = await fetchMedicinesFromBackend(1, 50);
      if (result.success) {
        setMedicines(result.medicines);
        setSearchResults(result.medicines.slice(0, 20));
      } else {
        console.error('Failed to load medicines:', result.error);
      }
    } catch (error) {
      console.error('Error loading medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMedicines = async (searchTerm) => {
    setLoading(true);
    try {
      const result = await searchMedicinesFromBackend(searchTerm, 1, 20);
      if (result.success) {
        setSearchResults(result.medicines);
      } else {
        console.error('Search failed:', result.error);
        // Fallback to local filter
        setSearchResults(medicines.filter(med => 
          med.name.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local filter
      setSearchResults(medicines.filter(med => 
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (med) => {
    // Transform backend data to match EditorScreen expectations
    const transformedMed = {
      id: med.id,
      name: med.name,
      strength: med.strength,
      type: med.type,
      category: med.category,
      dosages: [med.strength], // Use strength as default dosage
      imageUrl: med.imageUrl,
      notes: med.notes
    };
    
    onSelect(transformedMed);
    setSearch(med.name);
    setShowList(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chọn thuốc</Text>
      <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowList(true)}>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm tên thuốc..."
          onFocus={() => setShowList(true)}
        />
        <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
      
      <Modal visible={showList} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn thuốc</Text>
              <TouchableOpacity onPress={() => setShowList(false)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primaryDark} />
                <Text style={styles.loadingText}>Đang tải danh sách thuốc...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
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
                        {item.strength} • {item.type}
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
                    <Text style={styles.emptyText}>Không tìm thấy thuốc nào</Text>
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
  emptyText: { color: Colors.textMuted },
});