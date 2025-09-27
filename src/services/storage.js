import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'medtime_medications';

export async function saveMedications(medications) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
    return { success: true };
  } catch (error) {
    console.error('Failed to save medications:', error);
    return { success: false, error: error.message };
  }
}

export async function loadMedications() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load medications:', error);
    return [];
  }
}

export async function addMedication(medication) {
  try {
    const existing = await loadMedications();
    const newMed = {
      ...medication,
      id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...existing, newMed];
    await saveMedications(updated);
    return { success: true, medication: newMed };
  } catch (error) {
    console.error('Failed to add medication:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMedication(id, updates) {
  try {
    const existing = await loadMedications();
    const updated = existing.map(med => 
      med.id === id ? { ...med, ...updates, updatedAt: new Date().toISOString() } : med
    );
    await saveMedications(updated);
    return { success: true };
  } catch (error) {
    console.error('Failed to update medication:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteMedication(id) {
  try {
    const existing = await loadMedications();
    const updated = existing.filter(med => med.id !== id);
    await saveMedications(updated);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete medication:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteMedicationByNameAndTime(name, time) {
  try {
    const existing = await loadMedications();
    const updated = existing.filter(med => 
      !(med.name === name && med.times.some(t => t.time === time))
    );
    await saveMedications(updated);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete medication:', error);
    return { success: false, error: error.message };
  }
}