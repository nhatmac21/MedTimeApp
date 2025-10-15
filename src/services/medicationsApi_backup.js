import { loadMedications } from './storage';
import { getAuthToken } from './auth';
import dayjs from 'dayjs';

const API_BASE_URL = 'https://medtime-be.onrender.com/api';

// API helper function with authentication
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      'accept': '*/*',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return { success: true, data: data.data };
    } else {
      throw new Error(data.message || 'API request failed');
    }
  } catch (error) {
    console.log('API Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Fetch medicines from backend
export async function fetchMedicinesFromBackend(pageNumber = 1, pageSize = 50) {
  try {
    const result = await apiRequest(`/medicine?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    
    if (result.success) {
      return {
        success: true,
        medicines: result.data.items.map(item => ({
          id: item.medicineid.toString(),
          name: item.name,
          strength: `${item.strengthvalue}${item.strengthUnit}`,
          type: item.type,
          imageUrl: item.imageurl,
          notes: item.notes,
          category: getTypeCategory(item.type),
        })),
        pagination: {
          pageNumber: result.data.pageNumber,
          pageSize: result.data.pageSize,
          totalCount: result.data.totalCount,
          totalPages: result.data.totalPages,
          hasPreviousPage: result.data.hasPreviousPage,
          hasNextPage: result.data.hasNextPage,
        }
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể tải danh sách thuốc từ server' };
  }
}

// Helper function to categorize medicine types
const getTypeCategory = (type) => {
  const categories = {
    'TABLET': 'Viên nén',
    'CAPSULE': 'Viên nang',
    'INJECTION': 'Tiêm',
    'SYRUP': 'Siro',
    'CREAM': 'Kem bôi',
    'OINTMENT': 'Thuốc mỡ',
    'DROPS': 'Thuốc nhỏ',
    'INHALER': 'Dạng hít',
  };
  return categories[type] || 'Khác';
};

// Search medicines from backend
export async function searchMedicinesFromBackend(searchTerm, pageNumber = 1, pageSize = 20) {
  try {
    const result = await apiRequest(`/medicine/search?name=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
    
    if (result.success) {
      return {
        success: true,
        medicines: result.data.items.map(item => ({
          id: item.medicineid.toString(),
          name: item.name,
          strength: `${item.strengthvalue}${item.strengthUnit}`,
          type: item.type,
          imageUrl: item.imageurl,
          notes: item.notes,
          category: getTypeCategory(item.type),
        })),
        pagination: {
          pageNumber: result.data.pageNumber,
          totalCount: result.data.totalCount,
          hasNextPage: result.data.hasNextPage,
        }
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể tìm kiếm thuốc' };
  }
}

// Fallback function for local medications (keeping existing functionality)
export async function fetchMedicationsForDate(dateKey) {
  // dateKey: 'YYYY-MM-DD' 
  const storedMeds = await loadMedications();
  
  // Return stored medications with default pending status
  return storedMeds.map(med => ({
    ...med,
    times: med.times.map(time => ({
      ...time,
      status: time.status || 'pending'
    }))
  }));
}

export async function markDose({ medId, time, status, takenAt, note }) {
  // TODO: Implement API call to mark dose status
  // For now, just simulate success
  await new Promise((r) => setTimeout(r, 150));
  return { ok: true };
}