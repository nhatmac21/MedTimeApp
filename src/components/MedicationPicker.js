import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// Danh sách thuốc phổ biến Việt Nam
const COMMON_MEDICATIONS = [
  { id: 'paracetamol', name: 'Paracetamol', dosages: ['500mg', '650mg', '1000mg'] },
  { id: 'ibuprofen', name: 'Ibuprofen', dosages: ['200mg', '400mg', '600mg'] },
  { id: 'aspirin', name: 'Aspirin', dosages: ['100mg', '300mg', '500mg'] },
  { id: 'amlodipine', name: 'Amlodipine', dosages: ['5mg', '10mg'] },
  { id: 'metformin', name: 'Metformin', dosages: ['500mg', '850mg', '1000mg'] },
  { id: 'omeprazole', name: 'Omeprazole', dosages: ['20mg', '40mg'] },
  { id: 'simvastatin', name: 'Simvastatin', dosages: ['10mg', '20mg', '40mg'] },
  { id: 'lisinopril', name: 'Lisinopril', dosages: ['5mg', '10mg', '20mg'] },
  { id: 'omega3', name: 'Omega-3', dosages: ['100mg', '500mg', '1000mg'] },
  { id: 'vitamin-d', name: 'Vitamin D3', dosages: ['1000IU', '2000IU', '5000IU'] },
  { id: 'calcium', name: 'Canxi', dosages: ['500mg', '600mg', '1000mg'] },
  { id: 'multivitamin', name: 'Multivitamin', dosages: ['1 viên', '2 viên'] },
];

export default function MedicationPicker({ onSelect, selectedMed }) {
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);

  const filtered = COMMON_MEDICATIONS.filter(med => 
    med.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (med) => {
    onSelect(med);
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
      
      {showList && (
        <View style={styles.dropdown}>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            maxToRenderPerBatch={10}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.option, selectedMed?.id === item.id && styles.selectedOption]} 
                onPress={() => handleSelect(item)}
              >
                <Text style={[styles.optionText, selectedMed?.id === item.id && styles.selectedText]}>
                  {item.name}
                </Text>
                <Text style={styles.dosageHint}>
                  {item.dosages.slice(0, 2).join(', ')}...
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowList(false)}>
            <Text style={styles.closeBtnText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20, zIndex: 1000 },
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
  dropdown: { 
    position: 'absolute', 
    top: 60, 
    left: 0, 
    right: 0, 
    backgroundColor: Colors.card, 
    borderRadius: 12, 
    maxHeight: 200, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 5,
    zIndex: 1001
  },
  option: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectedOption: { backgroundColor: Colors.surface },
  optionText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  selectedText: { color: Colors.primaryDark },
  dosageHint: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  closeBtn: { padding: 12, alignItems: 'center', backgroundColor: Colors.surface },
  closeBtnText: { color: Colors.primaryDark, fontWeight: '600' },
});